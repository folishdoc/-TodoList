package com.liuzeyu.todolist.module.anniversary.service;

import com.liuzeyu.todolist.common.constant.PriorityEnum;
import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.anniversary.dto.AnniversaryRequest;
import com.liuzeyu.todolist.module.anniversary.dto.AnniversaryVO;
import com.liuzeyu.todolist.module.anniversary.entity.Anniversary;
import com.liuzeyu.todolist.module.anniversary.entity.ReminderLog;
import com.liuzeyu.todolist.module.anniversary.mapper.AnniversaryMapper;
import com.liuzeyu.todolist.module.anniversary.mapper.ReminderLogMapper;
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

/**
 * 纪念日服务 — 纪念日 CRUD、搜索排序、生成待办、提醒管理
 * <p>
 * 提供纪念日的完整管理功能，包括按名称搜索、按标签筛选、多字段排序。
 * 支持将纪念日一键生成关联待办任务（调用 TaskService.createTask）。
 * 提醒管理通过 ReminderLog 表实现已读/未读状态跟踪。
 */
@Service
@RequiredArgsConstructor
public class AnniversaryService {

    private final AnniversaryMapper anniversaryMapper;
    private final ReminderLogMapper reminderLogMapper;
    private final TaskService taskService;

    /**
     * 创建纪念日
     *
     * @param userId  用户 ID
     * @param request 纪念日请求
     * @return 创建后的纪念日
     */
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
        anniversaryMapper.insert(a);
        return a;
    }

    /**
     * 更新纪念日
     *
     * @param userId  用户 ID
     * @param id      纪念日 ID
     * @param request 更新请求
     * @return 更新后的纪念日
     * @throws BusinessException 404 不存在，403 无权修改
     */
    public Anniversary update(Long userId, Long id, AnniversaryRequest request) {
        Anniversary a = anniversaryMapper.findById(id);
        if (a == null) throw new BusinessException(404, "纪念日不存在");
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
        anniversaryMapper.update(a);
        return a;
    }

    /**
     * 删除纪念日
     *
     * @param userId 用户 ID
     * @param id     纪念日 ID
     * @throws BusinessException 404 不存在，403 无权删除
     */
    public void delete(Long userId, Long id) {
        Anniversary a = anniversaryMapper.findById(id);
        if (a == null) throw new BusinessException(404, "纪念日不存在");
        if (!a.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权删除");
        }
        anniversaryMapper.deleteById(id);
    }

    /**
     * 获取纪念日详情（含计算字段）
     *
     * @param userId 用户 ID
     * @param id     纪念日 ID
     * @return 纪念日 VO（含 nextDate、daysUntil 等）
     */
    public AnniversaryVO getDetail(Long userId, Long id) {
        Anniversary a = anniversaryMapper.findById(id);
        if (a == null) throw new BusinessException(404, "纪念日不存在");
        if (!a.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权查看");
        }
        return toVO(a);
    }

    /**
     * 获取纪念日列表（支持搜索、标签筛选、排序）
     *
     * @param userId 用户 ID
     * @param sortBy 排序字段（name/createdAt/nextDate）
     * @param order  排序方向（asc/desc）
     * @param search 搜索关键词（按名称模糊匹配）
     * @param tag    标签筛选（逗号分隔）
     * @return 纪念日 VO 列表
     */
    public List<AnniversaryVO> list(Long userId, String sortBy, String order, String search, String tag) {
        List<Anniversary> list;
        if (search != null && !search.isBlank()) {
            list = anniversaryMapper.searchByName(userId, search.trim());
        } else {
            list = anniversaryMapper.findAllByUserId(userId);
        }

        // 标签筛选
        if (tag != null && !tag.isBlank()) {
            list = list.stream()
                    .filter(a -> a.getTags() != null && Arrays.asList(a.getTags().split(",")).contains(tag.trim()))
                    .collect(Collectors.toList());
        }

        // 转换为 VO
        List<AnniversaryVO> vos = list.stream().map(this::toVO).collect(Collectors.toList());

        // 排序
        boolean desc = "desc".equalsIgnoreCase(order);
        String sort = sortBy != null ? sortBy : "nextDate";
        Comparator<AnniversaryVO> cmp = switch (sort) {
            case "name" -> Comparator.comparing(AnniversaryVO::getName);
            case "createdAt" -> Comparator.comparingLong(AnniversaryVO::getId); // id 自增代表创建顺序
            default -> Comparator.comparingLong(AnniversaryVO::getDaysUntil); // nextDate/daysUntil
        };
        if (desc) cmp = cmp.reversed();
        vos.sort(cmp);

        return vos;
    }

    /**
     * 为纪念日生成关联待办任务
     *
     * @param userId 用户 ID
     * @param id     纪念日 ID
     * @return 创建的任务
     */
    public Task generateTodo(Long userId, Long id) {
        Anniversary a = anniversaryMapper.findById(id);
        if (a == null) throw new BusinessException(404, "纪念日不存在");
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

    /**
     * 获取待处理的提醒（30天内未读）
     *
     * @param userId 用户 ID
     * @return 提醒日志列表
     */
    public List<ReminderLog> getPendingReminders(Long userId) {
        List<Anniversary> anniversaries = anniversaryMapper.findAllByUserId(userId);
        List<Long> ids = anniversaries.stream().map(Anniversary::getId).collect(Collectors.toList());
        if (ids.isEmpty()) return Collections.emptyList();
        return reminderLogMapper.findByAnniversaryIdInAndRemindDatetimeBetween(ids,
                LocalDateTime.now().minusDays(30), LocalDateTime.now().plusMinutes(1));
    }

    /**
     * 标记提醒为已读
     *
     * @param logId 提醒日志 ID
     */
    public void markReminderRead(Long logId) {
        ReminderLog log = reminderLogMapper.findById(logId);
        if (log != null) {
            log.setIsRead(true);
            reminderLogMapper.update(log);
        }
    }

    /**
     * 将 Anniversary 实体转换为 AnniversaryVO（含计算字段）
     *
     * @param a 纪念日实体
     * @return 纪念日 VO
     */
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
