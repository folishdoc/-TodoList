package com.liuzeyu.todolist.module.anniversary.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * 纪念日日期计算工具
 * <p>
 * 纯静态工具类，提供两个核心方法：
 * - getNextOccurrence：根据原始日期和重复类型计算下一次发生日期
 * - getDaysUntil：计算距离目标日期的天数
 * <p>
 * 重复类型支持：NONE（不重复）、YEARLY（每年）、MONTHLY（每月）、WEEKLY（每周）。
 * 对于 NONE 类型，如果今年已过则返回明年同日。
 */
public class AnniversaryCalculator {

    /**
     * 计算下一次纪念日日期
     *
     * @param date       原始日期
     * @param repeatType 重复类型（NONE/YEARLY/MONTHLY/WEEKLY）
     * @return 下一次发生的日期
     */
    public static LocalDate getNextOccurrence(LocalDate date, String repeatType) {
        if (repeatType == null || "NONE".equalsIgnoreCase(repeatType)) {
            // 不重复：若今年已过，返回明年同日
            LocalDate today = LocalDate.now();
            LocalDate thisYear = date.withYear(today.getYear());
            if (!thisYear.isBefore(today)) return thisYear;
            return date.withYear(today.getYear() + 1);
        }

        LocalDate today = LocalDate.now();

        switch (repeatType.toUpperCase()) {
            case "YEARLY": {
                LocalDate candidate = date.withYear(today.getYear());
                if (candidate.isBefore(today)) candidate = date.withYear(today.getYear() + 1);
                return candidate;
            }
            case "MONTHLY": {
                // 每月同一天，如果当月没有该天则取当月最后一天
                LocalDate candidate = LocalDate.of(today.getYear(), today.getMonth(), Math.min(date.getDayOfMonth(), today.lengthOfMonth()));
                if (candidate.isBefore(today) || candidate.equals(today)) {
                    candidate = candidate.plusMonths(1);
                    candidate = candidate.withDayOfMonth(Math.min(date.getDayOfMonth(), candidate.lengthOfMonth()));
                }
                return candidate;
            }
            case "WEEKLY": {
                // 每周同星期几，当天不算，跳到下周同一天
                int targetDayOfWeek = date.getDayOfWeek().getValue();
                int todayDayOfWeek = today.getDayOfWeek().getValue();
                int daysUntil = (targetDayOfWeek - todayDayOfWeek + 7) % 7;
                if (daysUntil == 0) daysUntil = 7;
                return today.plusDays(daysUntil);
            }
            default:
                return date;
        }
    }

    /**
     * 返回距离目标日期的天数
     *
     * @param nextDate 目标日期
     * @return 天数（正数=未来，负数=过去，0=今天）
     */
    public static long getDaysUntil(LocalDate nextDate) {
        return ChronoUnit.DAYS.between(LocalDate.now(), nextDate);
    }
}
