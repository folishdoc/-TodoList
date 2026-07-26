package com.liuzeyu.todolist.module.anniversary.integration;

import com.liuzeyu.todolist.module.anniversary.entity.Anniversary;
import com.liuzeyu.todolist.module.anniversary.entity.ReminderLog;
import com.liuzeyu.todolist.module.anniversary.repository.AnniversaryRepository;
import com.liuzeyu.todolist.module.anniversary.repository.ReminderLogRepository;
import com.liuzeyu.todolist.module.anniversary.service.AnniversaryReminderService;
import com.liuzeyu.todolist.support.BaseIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 纪念日提醒集成测试 — 验证 AnniversaryReminderService.checkAnniversaryReminders() 的去重逻辑。
 * 手动调用而非等待 cron（@Scheduled 已在 application-test.properties 禁用）。
 */
@DisplayName("纪念日提醒集成测试 - Testcontainers MySQL")
class AnniversaryReminderIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AnniversaryRepository anniversaryRepository;

    @Autowired
    private ReminderLogRepository reminderLogRepository;

    @Autowired
    private AnniversaryReminderService reminderService;

    private long countLogsForAnniversary(Long anniversaryId) {
        return reminderLogRepository.findAll().stream()
                .filter(l -> l.getAnniversaryId().equals(anniversaryId))
                .count();
    }

    @Test
    @DisplayName("首次提醒：创建纪念日 + 调用提醒 → 生成 ReminderLog")
    void firstCheckCreatesReminderLog() {
        String unique = UUID.randomUUID().toString().substring(0, 8);

        Anniversary a = new Anniversary();
        a.setUserId(1L);
        a.setName("提醒测试-" + unique);
        a.setDate(LocalDate.now().minusDays(1));
        a.setRepeatType("YEARLY");
        a.setRemindEnabled(true);
        a.setRemindDaysBefore("0");
        a.setRemindTime(java.time.LocalTime.of(0, 1));
        a = anniversaryRepository.save(a);
        final Long aid = a.getId();

        long before = countLogsForAnniversary(aid);
        reminderService.checkAnniversaryReminders();
        long after = countLogsForAnniversary(aid);

        assertThat(after).isEqualTo(before + 1);

        // 清理
        reminderLogRepository.deleteAll(
            reminderLogRepository.findAll().stream()
                .filter(l -> l.getAnniversaryId().equals(aid))
                .toList()
        );
        anniversaryRepository.deleteById(aid);
    }

    @Test
    @DisplayName("去重：第二次调用同一提醒时间 → 不生成重复 ReminderLog")
    void secondCheckDedupesReminderLog() throws InterruptedException {
        String unique = UUID.randomUUID().toString().substring(0, 8);

        Anniversary a = new Anniversary();
        a.setUserId(1L);
        a.setName("去重测试-" + unique);
        a.setDate(LocalDate.now().minusDays(1));
        a.setRepeatType("YEARLY");
        a.setRemindEnabled(true);
        a.setRemindDaysBefore("0");
        a.setRemindTime(java.time.LocalTime.of(0, 1));
        a = anniversaryRepository.save(a);
        final Long aid = a.getId();

        reminderService.checkAnniversaryReminders();
        long firstCount = countLogsForAnniversary(aid);
        assertThat(firstCount).isEqualTo(1);

        Thread.sleep(1100);
        reminderService.checkAnniversaryReminders();
        long secondCount = countLogsForAnniversary(aid);
        assertThat(secondCount).isEqualTo(1);

        // 清理
        reminderLogRepository.deleteAll(
            reminderLogRepository.findAll().stream()
                .filter(l -> l.getAnniversaryId().equals(aid))
                .toList()
        );
        anniversaryRepository.deleteById(aid);
    }

    @Test
    @DisplayName("禁用提醒：remindEnabled=false → 不生成 ReminderLog")
    void disabledReminderDoesNotTrigger() {
        String unique = UUID.randomUUID().toString().substring(0, 8);

        Anniversary a = new Anniversary();
        a.setUserId(1L);
        a.setName("禁用提醒测试-" + unique);
        a.setDate(LocalDate.now().minusDays(1));
        a.setRepeatType("YEARLY");
        a.setRemindEnabled(false);
        a.setRemindDaysBefore("0");
        a = anniversaryRepository.save(a);
        final Long aid = a.getId();

        reminderService.checkAnniversaryReminders();
        long count = countLogsForAnniversary(aid);
        assertThat(count).isEqualTo(0);

        anniversaryRepository.deleteById(aid);
    }

    @Test
    @DisplayName("多天前提醒：remindDaysBefore='0,3,7' → 生成 3 条 ReminderLog")
    void multipleDaysBeforeGeneratesMultipleLogs() {
        String unique = UUID.randomUUID().toString().substring(0, 8);

        Anniversary a = new Anniversary();
        a.setUserId(1L);
        a.setName("多天提醒测试-" + unique);
        a.setDate(LocalDate.now().minusDays(10));
        a.setRepeatType("YEARLY");
        a.setRemindEnabled(true);
        a.setRemindDaysBefore("0,3,7");
        a.setRemindTime(java.time.LocalTime.of(0, 1));
        a = anniversaryRepository.save(a);
        final Long aid = a.getId();

        reminderService.checkAnniversaryReminders();
        long count = countLogsForAnniversary(aid);
        // 三个提醒日都已过 → 应生成 3 条
        assertThat(count).isEqualTo(3);

        reminderLogRepository.deleteAll(
            reminderLogRepository.findAll().stream()
                .filter(l -> l.getAnniversaryId().equals(aid))
                .toList()
        );
        anniversaryRepository.deleteById(aid);
    }
}
