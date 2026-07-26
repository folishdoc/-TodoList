package com.liuzeyu.todolist.module.anniversary.service;

import com.liuzeyu.todolist.common.constant.PriorityEnum;
import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.anniversary.dto.AnniversaryRequest;
import com.liuzeyu.todolist.module.anniversary.dto.AnniversaryVO;
import com.liuzeyu.todolist.module.anniversary.entity.Anniversary;
import com.liuzeyu.todolist.module.anniversary.entity.ReminderLog;
import com.liuzeyu.todolist.module.anniversary.repository.AnniversaryRepository;
import com.liuzeyu.todolist.module.anniversary.repository.ReminderLogRepository;
import com.liuzeyu.todolist.module.task.dto.TaskRequest;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnniversaryService {

    private final AnniversaryRepository anniversaryRepository;
    private final ReminderLogRepository reminderLogRepository;
    private final TaskService taskService;

    public Anniversary create(Long userId, AnniversaryRequest request) {
        Anniversary a = new Anniversary();
        a.setUserId(userId);
        a.setName(request.getName());
        a.setDate(request.getDate());
        a.setRepeatType(request.getRepeatType() != null ? request.getRepeatType() : "NONE");
        a.setRemindEnabled(request.getRemindEnabled() != null ? request.getRemindEnabled() : false);
        a.setRemindDaysBefore(request.getRemindDaysBefore() != null ? request.getRemindDaysBefore() : "0");
        a.setRemindTime(request.getRemindTime() != null ? request.getRemindTime() : LocalTime.of(9, 0));
        a.setTags(request.getTags());
        a.setNotes(request.getNotes());
        return anniversaryRepository.save(a);
    }

    public Anniversary update(Long userId, Long id, AnniversaryRequest request) {
        Anniversary a = anniversaryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "纪念日不存在"));
        if (!a.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权修改");
        }
        a.setName(request.getName());
        a.setDate(request.getDate());
        a.setRepeatType(request.getRepeatType() != null ? request.getRepeatType() : "NONE");
        a.setRemindEnabled(request.getRemindEnabled() != null ? request.getRemindEnabled() : false);
        a.setRemindDaysBefore(request.getRemindDaysBefore() != null ? request.getRemindDaysBefore() : "0");
        a.setRemindTime(request.getRemindTime() != null ? request.getRemindTime() : LocalTime.of(9, 0));
        a.setTags(request.getTags());
        a.setNotes(request.getNotes());
        return anniversaryRepository.save(a);
    }

    public void delete(Long userId, Long id) {
        Anniversary a = anniversaryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "纪念日不存在"));
        if (!a.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权删除");
        }
        anniversaryRepository.delete(a);
    }

    public AnniversaryVO getDetail(Long userId, Long id) {
        Anniversary a = anniversaryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "纪念日不存在"));
        if (!a.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权查看");
        }
        return toVO(a);
    }

    public List<AnniversaryVO> list(Long userId, String sortBy, String order, String search, String tag) {
        List<Anniversary> list;
        if (search != null && !search.isBlank()) {
            list = anniversaryRepository.searchByName(userId, search.trim());
        } else {
            list = anniversaryRepository.findAllByUserId(userId);
        }

        // 标签筛选
        if (tag != null && !tag.isBlank()) {
            list = list.stream()
                    .filter(a -> a.getTags() != null && Arrays.asList(a.getTags().split(",")).contains(tag.trim()))
                    .collect(Collectors.toList());
        }

        // 转换为VO
        List<AnniversaryVO> vos = list.stream().map(this::toVO).collect(Collectors.toList());

        // 排序
        boolean desc = "desc".equalsIgnoreCase(order);
        String sort = sortBy != null ? sortBy : "nextDate";
        Comparator<AnniversaryVO> cmp = switch (sort) {
            case "name" -> Comparator.comparing(AnniversaryVO::getName);
            case "createdAt" -> Comparator.comparingLong(AnniversaryVO::getId); // id自增代表创建顺序
            default -> Comparator.comparingLong(AnniversaryVO::getDaysUntil); // nextDate/daysUntil
        };
        if (desc) cmp = cmp.reversed();
        vos.sort(cmp);

        return vos;
    }

    public Task generateTodo(Long userId, Long id) {
        Anniversary a = anniversaryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "纪念日不存在"));
        if (!a.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权操作");
        }
        LocalDate nextDate = AnniversaryCalculator.getNextOccurrence(a.getDate(), a.getRepeatType());
        long daysUntil = AnniversaryCalculator.getDaysUntil(nextDate);

        TaskRequest req = new TaskRequest();
        req.setTitle("纪念日: " + a.getName());
        req.setDescription("关联纪念日ID: " + a.getId() + "\n下一个纪念日: " + nextDate + " (还有" + daysUntil + "天)\n" + (a.getNotes() != null ? a.getNotes() : ""));
        req.setDueDate(LocalDateTime.of(nextDate, LocalTime.of(23, 59)));
        req.setPriority(PriorityEnum.MEDIUM.getCode());

        return taskService.createTask(userId, req);
    }

    public List<ReminderLog> getPendingReminders(Long userId) {
        List<Anniversary> anniversaries = anniversaryRepository.findAllByUserId(userId);
        List<Long> ids = anniversaries.stream().map(Anniversary::getId).collect(Collectors.toList());
        if (ids.isEmpty()) return Collections.emptyList();
        return reminderLogRepository.findByAnniversaryIdInAndRemindDatetimeBetween(ids,
                LocalDateTime.now().minusDays(30), LocalDateTime.now().plusMinutes(1));
    }

    public void markReminderRead(Long logId) {
        reminderLogRepository.findById(logId).ifPresent(log -> {
            log.setIsRead(true);
            reminderLogRepository.save(log);
        });
    }

    private AnniversaryVO toVO(Anniversary a) {
        LocalDate nextDate = AnniversaryCalculator.getNextOccurrence(a.getDate(), a.getRepeatType());
        long daysUntil = AnniversaryCalculator.getDaysUntil(nextDate);

        List<LocalDateTime> nextRemindTimes = Collections.emptyList();
        if (a.getRemindEnabled() && a.getRemindDaysBefore() != null) {
            String[] days = a.getRemindDaysBefore().split(",");
            nextRemindTimes = Arrays.stream(days)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Integer::parseInt)
                    .map(d -> LocalDateTime.of(nextDate.minusDays(d), a.getRemindTime() != null ? a.getRemindTime() : LocalTime.of(9, 0)))
                    .sorted()
                    .collect(Collectors.toList());
        }

        return new AnniversaryVO(
                a.getId(), a.getName(), a.getDate(), a.getRepeatType(),
                a.getRemindEnabled(), a.getRemindDaysBefore(),
                a.getRemindTime() != null ? a.getRemindTime().toString() : "09:00",
                a.getTags(), a.getNotes(), nextDate, daysUntil, nextRemindTimes
        );
    }
}
