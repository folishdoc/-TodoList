package com.liuzeyu.todolist.module.anniversary.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class AnniversaryCalculatorTest {

    @Test
    @DisplayName("NONE 重复 - 今年未来日期返回今年")
    void none_futureThisYear() {
        LocalDate future = LocalDate.now().plusDays(10);
        LocalDate result = AnniversaryCalculator.getNextOccurrence(future, "NONE");
        assertThat(result.getYear()).isEqualTo(LocalDate.now().getYear());
        assertThat(result.getMonthValue()).isEqualTo(future.getMonthValue());
        assertThat(result.getDayOfMonth()).isEqualTo(future.getDayOfMonth());
    }

    @Test
    @DisplayName("NONE 重复 - 今年的已过日期返回明年")
    void none_pastGoesToNextYear() {
        LocalDate past = LocalDate.now().minusDays(10);
        LocalDate result = AnniversaryCalculator.getNextOccurrence(past, "NONE");
        assertThat(result.getYear()).isEqualTo(LocalDate.now().getYear() + 1);
    }

    @Test
    @DisplayName("YEARLY - 同 NONE 行为")
    void yearly_works() {
        LocalDate past = LocalDate.now().minusDays(10);
        LocalDate result = AnniversaryCalculator.getNextOccurrence(past, "YEARLY");
        assertThat(result.getYear()).isEqualTo(LocalDate.now().getYear() + 1);
    }

    @Test
    @DisplayName("MONTHLY - 未来本月返回本月，已过则下月")
    void monthly_skipsToNext() {
        LocalDate pastDay = LocalDate.of(2020, 1, 15);
        LocalDate result = AnniversaryCalculator.getNextOccurrence(pastDay, "MONTHLY");
        // 任何 past day 的下一个 monthly 都应 >= 今天
        assertThat(result).isAfterOrEqualTo(LocalDate.now().minusDays(1));
    }

    @Test
    @DisplayName("WEEKLY - 始终推进到下一周同一天")
    void weekly_alwaysNextOccurrence() {
        LocalDate past = LocalDate.of(2020, 1, 1);
        LocalDate result = AnniversaryCalculator.getNextOccurrence(past, "WEEKLY");
        assertThat(result).isAfter(LocalDate.now().minusDays(1));
    }

    @Test
    @DisplayName("getDaysUntil - 正数")
    void daysUntil_positive() {
        long days = AnniversaryCalculator.getDaysUntil(LocalDate.now().plusDays(5));
        assertThat(days).isEqualTo(5);
    }

    @Test
    @DisplayName("getDaysUntil - 负数")
    void daysUntil_negative() {
        long days = AnniversaryCalculator.getDaysUntil(LocalDate.now().minusDays(3));
        assertThat(days).isEqualTo(-3);
    }

    @Test
    @DisplayName("getDaysUntil - 0")
    void daysUntil_zero() {
        long days = AnniversaryCalculator.getDaysUntil(LocalDate.now());
        assertThat(days).isEqualTo(0);
    }

    @Test
    @DisplayName("未知 repeatType - 返回原 date")
    void unknownType_returnsOriginal() {
        LocalDate original = LocalDate.of(2020, 1, 1);
        LocalDate result = AnniversaryCalculator.getNextOccurrence(original, "FOO_BAR");
        assertThat(result).isEqualTo(original);
    }
}
