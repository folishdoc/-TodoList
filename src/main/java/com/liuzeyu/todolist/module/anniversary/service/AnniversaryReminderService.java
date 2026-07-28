package com.liuzeyu.todolist.module.anniversary.service;

import com.liuzeyu.todolist.module.anniversary.entity.Anniversary;
import com.liuzeyu.todolist.module.anniversary.entity.ReminderLog;
import com.liuzeyu.todolist.module.anniversary.mapper.AnniversaryMapper;
import com.liuzeyu.todolist.module.anniversary.mapper.ReminderLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

/**
 * 纪念日提醒服务 — 定时检查并触发提醒
 * <p>
 * 每分钟执行一次（@Scheduled(cron = "0 * * * * ?")），
 * 扫描所有已启用提醒的纪念日，计算下次发生日期和提醒时间，
 * 如果当前时间已到达提醒时间且未生成过提醒日志，则插入 ReminderLog 记录。
 * 通过 ReminderLog 表去重，防止同一条提醒被多次触发。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnniversaryReminderService {

    private final AnniversaryMapper anniversaryMapper;
    private final ReminderLogMapper reminderLogMapper;

    /**
     * 每分钟检查待提醒的纪念日
     * <p>
     * 只查询已启用提醒的纪念日（代替全表扫描），
     * 对每个纪念日计算所有提前提醒时间，检查是否需要触发。
     */
    @Scheduled(cron = "0 * * * * ?")
    public void checkAnniversaryReminders() {
        log.debug("检查纪念日提醒...");
        // 只查询已启用提醒的纪念日（代替全表扫描）
        List<Anniversary> allEnabled = anniversaryMapper.findRemindEnabledByUserId(1L);

        LocalDateTime now = LocalDateTime.now();
        for (Anniversary a : allEnabled) {
            try {
                LocalDate nextDate = AnniversaryCalculator.getNextOccurrence(a.getDate(), a.getRepeatType());
                String[] daysBeforeArr = a.getRemindDaysBefore() != null ? a.getRemindDaysBefore().split(",") : new String[]{"0"};
                for (String ds : daysBeforeArr) {
                    try {
                        int daysBefore = Integer.parseInt(ds.trim());
                        LocalTime remindTime = a.getRemindTime() != null ? a.getRemindTime() : LocalTime.of(9, 0);
                        LocalDateTime remindAt = LocalDateTime.of(nextDate.minusDays(daysBefore), remindTime);

                        if (now.isAfter(remindAt) || now.isEqual(remindAt)) {
                            // 检查是否已生成过提醒（去重）
                            List<ReminderLog> existing = reminderLogMapper
                                    .findByAnniversaryIdAndRemindDatetime(a.getId(), remindAt);
                            if (existing.isEmpty()) {
                                ReminderLog entry = new ReminderLog();
                                entry.setAnniversaryId(a.getId());
                                entry.setRemindDatetime(remindAt);
                                entry.setIsRead(false);
                                reminderLogMapper.insert(entry);
                                log.info("触发提醒: 纪念日={}, 提醒时间={}", a.getName(), remindAt);
                            }
                        }
                    } catch (NumberFormatException e) {
                        log.warn("解析 remindDaysBefore 失败: anniversaryId={}, value='{}'", a.getId(), ds, e);
                    }
                }
            } catch (Exception e) {
                log.error("检查纪念日提醒失败: anniversaryId={}", a.getId(), e);
            }
        }
    }
}
