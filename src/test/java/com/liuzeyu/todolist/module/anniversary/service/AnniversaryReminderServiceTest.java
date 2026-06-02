package com.liuzeyu.todolist.module.anniversary.service;

import com.liuzeyu.todolist.module.anniversary.entity.Anniversary;
import com.liuzeyu.todolist.module.anniversary.entity.ReminderLog;
import com.liuzeyu.todolist.module.anniversary.repository.AnniversaryRepository;
import com.liuzeyu.todolist.module.anniversary.repository.ReminderLogRepository;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AnniversaryReminderServiceTest extends BaseUnitTest {

    @Mock
    private AnniversaryRepository anniversaryRepository;

    @Mock
    private ReminderLogRepository reminderLogRepository;

    @InjectMocks
    private AnniversaryReminderService service;

    /**
     * 构造一个"今天已过期"的纪念日：
     *  - date 是今天 → getNextOccurrence 返回今年今天
     *  - remindTime 在过去（如 0:01）
     *  - remindDaysBefore = "0"
     */
    private Anniversary pastReminderAnniversary(Long id) {
        Anniversary a = new Anniversary();
        a.setId(id);
        a.setRemindEnabled(true);
        a.setDate(LocalDate.now());
        a.setRemindDaysBefore("0");
        a.setRemindTime(LocalTime.of(0, 1));
        return a;
    }

    @Test
    @DisplayName("检查提醒 - 禁用提醒的纪念日不触发")
    void disabled_anniversary_notTriggered() {
        Anniversary a = new Anniversary();
        a.setId(1L);
        a.setRemindEnabled(false);
        a.setDate(LocalDate.now());
        when(anniversaryRepository.findAll()).thenReturn(List.of(a));

        service.checkAnniversaryReminders();

        verify(reminderLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("检查提醒 - 未来提醒不触发")
    void futureReminder_notTriggered() {
        Anniversary a = new Anniversary();
        a.setId(1L);
        a.setRemindEnabled(true);
        a.setDate(LocalDate.now().plusDays(7));
        a.setRemindDaysBefore("0");
        a.setRemindTime(LocalTime.of(9, 0));
        when(anniversaryRepository.findAll()).thenReturn(List.of(a));

        service.checkAnniversaryReminders();

        verify(reminderLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("检查提醒 - 已过期的提醒应写入 ReminderLog")
    void overdueReminder_writesLog() {
        Anniversary a = pastReminderAnniversary(1L);
        when(anniversaryRepository.findAll()).thenReturn(List.of(a));
        when(reminderLogRepository.findByAnniversaryIdAndRemindDatetime(any(), any())).thenReturn(List.of());

        service.checkAnniversaryReminders();

        ArgumentCaptor<ReminderLog> captor = ArgumentCaptor.forClass(ReminderLog.class);
        verify(reminderLogRepository).save(captor.capture());
        ReminderLog saved = captor.getValue();
        assertThat(saved.getAnniversaryId()).isEqualTo(1L);
        assertThat(saved.getIsRead()).isFalse();
    }

    @Test
    @DisplayName("检查提醒 - 已存在同时间日志则不重复")
    void duplicateReminder_deduped() {
        Anniversary a = pastReminderAnniversary(1L);
        when(anniversaryRepository.findAll()).thenReturn(List.of(a));
        ReminderLog existing = new ReminderLog();
        when(reminderLogRepository.findByAnniversaryIdAndRemindDatetime(any(), any())).thenReturn(List.of(existing));

        service.checkAnniversaryReminders();

        verify(reminderLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("检查提醒 - 多天前提醒（如 7天前、1天前）都触发")
    void multipleDaysBefore_bothTrigger() {
        Anniversary a = new Anniversary();
        a.setId(1L);
        a.setRemindEnabled(true);
        a.setDate(LocalDate.now());
        a.setRemindDaysBefore("0,1");
        a.setRemindTime(LocalTime.of(0, 1));
        when(anniversaryRepository.findAll()).thenReturn(List.of(a));
        when(reminderLogRepository.findByAnniversaryIdAndRemindDatetime(any(), any())).thenReturn(List.of());

        service.checkAnniversaryReminders();

        verify(reminderLogRepository, times(2)).save(any(ReminderLog.class));
    }

    @Test
    @DisplayName("检查提醒 - remindDaysBefore 为 null 时使用默认 0")
    void nullRemindDaysBefore_usesDefault() {
        Anniversary a = pastReminderAnniversary(1L);
        a.setRemindDaysBefore(null);
        when(anniversaryRepository.findAll()).thenReturn(List.of(a));
        when(reminderLogRepository.findByAnniversaryIdAndRemindDatetime(any(), any())).thenReturn(List.of());

        service.checkAnniversaryReminders();

        verify(reminderLogRepository, times(1)).save(any(ReminderLog.class));
    }

    @Test
    @DisplayName("检查提醒 - 无效的天数格式（NumberFormatException）被忽略")
    void invalidDaysFormat_ignored() {
        Anniversary a = pastReminderAnniversary(1L);
        a.setRemindDaysBefore("abc,xyz");
        when(anniversaryRepository.findAll()).thenReturn(List.of(a));

        service.checkAnniversaryReminders();

        verify(reminderLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("检查提醒 - 提醒时间为 null 时使用默认 09:00")
    void nullRemindTime_usesDefault() {
        Anniversary a = pastReminderAnniversary(1L);
        a.setRemindTime(null);
        when(anniversaryRepository.findAll()).thenReturn(List.of(a));
        when(reminderLogRepository.findByAnniversaryIdAndRemindDatetime(any(), any())).thenReturn(List.of());

        service.checkAnniversaryReminders();

        ArgumentCaptor<ReminderLog> captor = ArgumentCaptor.forClass(ReminderLog.class);
        verify(reminderLogRepository).save(captor.capture());
        assertThat(captor.getValue().getRemindDatetime().toLocalTime()).isEqualTo(LocalTime.of(9, 0));
    }

    @Test
    @DisplayName("检查提醒 - 混合启用和禁用纪念日")
    void mixedEnabledAndDisabled() {
        Anniversary enabled = pastReminderAnniversary(1L);
        Anniversary disabled = new Anniversary();
        disabled.setId(2L);
        disabled.setRemindEnabled(false);
        disabled.setDate(LocalDate.now());
        when(anniversaryRepository.findAll()).thenReturn(List.of(enabled, disabled));
        when(reminderLogRepository.findByAnniversaryIdAndRemindDatetime(any(), any())).thenReturn(List.of());

        service.checkAnniversaryReminders();

        verify(reminderLogRepository, times(1)).save(any(ReminderLog.class));
    }
}
