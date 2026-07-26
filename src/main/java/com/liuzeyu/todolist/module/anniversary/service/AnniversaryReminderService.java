package com.liuzeyu.todolist.module.anniversary.service;

import com.liuzeyu.todolist.module.anniversary.entity.Anniversary;
import com.liuzeyu.todolist.module.anniversary.entity.ReminderLog;
import com.liuzeyu.todolist.module.anniversary.repository.AnniversaryRepository;
import com.liuzeyu.todolist.module.anniversary.repository.ReminderLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnniversaryReminderService {

    private final AnniversaryRepository anniversaryRepository;
    private final ReminderLogRepository reminderLogRepository;

    /**
     * 每分钟检查待提醒的纪念日
     */
    @Scheduled(cron = "0 * * * * ?")
    public void checkAnniversaryReminders() {
        log.debug("检查纪念日提醒...");
        // 只查询已启用提醒的纪念日（代替全表扫描）
        List<Anniversary> allEnabled = anniversaryRepository.findRemindEnabledByUserId(1L);

        LocalDateTime now = LocalDateTime.now();
        for (Anniversary a : allEnabled) {
            LocalDate nextDate = AnniversaryCalculator.getNextOccurrence(a.getDate(), a.getRepeatType());
            String[] daysBeforeArr = a.getRemindDaysBefore() != null ? a.getRemindDaysBefore().split(",") : new String[]{"0"};
            for (String ds : daysBeforeArr) {
                try {
                    int daysBefore = Integer.parseInt(ds.trim());
                    LocalTime remindTime = a.getRemindTime() != null ? a.getRemindTime() : LocalTime.of(9, 0);
                    LocalDateTime remindAt = LocalDateTime.of(nextDate.minusDays(daysBefore), remindTime);

                    if (now.isAfter(remindAt) || now.isEqual(remindAt)) {
                        List<ReminderLog> existing = reminderLogRepository
                                .findByAnniversaryIdAndRemindDatetime(a.getId(), remindAt);
                        if (existing.isEmpty()) {
                            ReminderLog entry = new ReminderLog();
                            entry.setAnniversaryId(a.getId());
                            entry.setRemindDatetime(remindAt);
                            entry.setIsRead(false);
                            reminderLogRepository.save(entry);
                            log.info("触发提醒: 纪念日={}, 提醒时间={}", a.getName(), remindAt);
                        }
                    }
                } catch (NumberFormatException ignored) {
                }
            }
        }
    }
}
