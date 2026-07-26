package com.liuzeyu.todolist.module.habit.service;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.habit.entity.Habit;
import com.liuzeyu.todolist.module.habit.entity.HabitRecord;
import com.liuzeyu.todolist.module.habit.mapper.HabitRecordRepository;
import com.liuzeyu.todolist.module.habit.mapper.HabitRepository;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class HabitServiceTest extends BaseUnitTest {

    @Mock
    private HabitRepository habitRepository;

    @Mock
    private HabitRecordRepository habitRecordRepository;

    @InjectMocks
    private HabitService habitService;

    @Test
    @DisplayName("创建习惯 - 初始化 streak 为 0")
    void createHabit_initializesStreaks() {
        Habit habit = new Habit();
        habit.setName("晨跑");
        when(habitRepository.save(any(Habit.class))).thenAnswer(inv -> inv.getArgument(0));

        Habit result = habitService.createHabit(1L, habit);

        assertThat(result.getCurrentStreak()).isEqualTo(0);
        assertThat(result.getMaxStreak()).isEqualTo(0);
        assertThat(result.getTotalCompletions()).isEqualTo(0);
        assertThat(result.getUserId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("获取习惯 - 越权访问抛异常")
    void getHabit_wrongUser_throws() {
        Habit h = new Habit();
        h.setId(1L);
        h.setUserId(2L);
        when(habitRepository.findById(1L)).thenReturn(Optional.of(h));

        assertThatThrownBy(() -> habitService.getHabit(1L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("无权访问该习惯");
    }

    @Test
    @DisplayName("更新习惯 - 正常")
    void updateHabit_succeeds() {
        Habit existing = new Habit();
        existing.setId(1L);
        existing.setUserId(1L);
        existing.setName("旧");
        when(habitRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(habitRepository.save(any(Habit.class))).thenAnswer(inv -> inv.getArgument(0));

        Habit data = new Habit();
        data.setName("新");
        data.setIcon("🏃");
        Habit result = habitService.updateHabit(1L, 1L, data);

        assertThat(result.getName()).isEqualTo("新");
        assertThat(result.getIcon()).isEqualTo("🏃");
    }

    @Test
    @DisplayName("删除习惯 - 级联删除打卡记录")
    void deleteHabit_cascadesRecords() {
        Habit h = new Habit();
        h.setId(1L);
        h.setUserId(1L);
        when(habitRepository.findById(1L)).thenReturn(Optional.of(h));
        HabitRecord r = new HabitRecord();
        r.setId(100L);
        when(habitRecordRepository.findByHabitId(1L)).thenReturn(List.of(r));

        habitService.deleteHabit(1L, 1L);

        verify(habitRecordRepository).deleteAll(List.of(r));
        verify(habitRepository).delete(h);
    }

    @Test
    @DisplayName("打卡 - 同一天重复打卡抛异常（非补卡）")
    void checkIn_duplicateSameDay_throws() {
        Habit h = new Habit();
        h.setId(1L);
        h.setUserId(1L);
        when(habitRepository.findById(1L)).thenReturn(Optional.of(h));
        when(habitRecordRepository.findByHabitIdAndCheckDate(eq(1L), any())).thenReturn(Optional.of(new HabitRecord()));

        assertThatThrownBy(() -> habitService.checkIn(1L, 1L, LocalDate.now(), 1.0, null, false))
                .isInstanceOf(BusinessException.class)
                .hasMessage("今天已经打卡过了");
    }

    @Test
    @DisplayName("打卡 - 补卡允许同一天")
    void checkIn_makeupAllowsDuplicate() {
        Habit h = new Habit();
        h.setId(1L);
        h.setUserId(1L);
        when(habitRepository.findById(1L)).thenReturn(Optional.of(h));
        when(habitRecordRepository.save(any(HabitRecord.class))).thenAnswer(inv -> inv.getArgument(0));
        when(habitRecordRepository.countByHabitIdAndCheckDateAfter(eq(1L), any())).thenReturn(1L);
        HabitRecord r = new HabitRecord();
        r.setCheckDate(LocalDate.now());
        when(habitRecordRepository.findByHabitId(1L)).thenReturn(new java.util.ArrayList<>(List.of(r)));

        HabitRecord result = habitService.checkIn(1L, 1L, LocalDate.now(), 1.0, "补卡", true);

        assertThat(result.getIsMakeup()).isTrue();
        assertThat(result.getNote()).isEqualTo("补卡");
    }

    @Test
    @DisplayName("打卡 - 正常创建记录并更新统计")
    void checkIn_succeeds() {
        Habit h = new Habit();
        h.setId(1L);
        h.setUserId(1L);
        when(habitRepository.findById(1L)).thenReturn(Optional.of(h));
        when(habitRecordRepository.findByHabitIdAndCheckDate(eq(1L), any())).thenReturn(Optional.empty());
        when(habitRecordRepository.save(any(HabitRecord.class))).thenAnswer(inv -> inv.getArgument(0));
        when(habitRecordRepository.countByHabitIdAndCheckDateAfter(eq(1L), any())).thenReturn(1L);
        HabitRecord r = new HabitRecord();
        r.setCheckDate(LocalDate.now());
        when(habitRecordRepository.findByHabitId(1L)).thenReturn(new java.util.ArrayList<>(List.of(r)));
        when(habitRepository.save(any(Habit.class))).thenAnswer(inv -> inv.getArgument(0));

        HabitRecord result = habitService.checkIn(1L, 1L, LocalDate.now(), 1.0, "good", false);

        ArgumentCaptor<HabitRecord> captor = ArgumentCaptor.forClass(HabitRecord.class);
        verify(habitRecordRepository).save(captor.capture());
        assertThat(captor.getValue().getCompletionValue()).isEqualTo(1.0);
        assertThat(captor.getValue().getIsMakeup()).isFalse();
        assertThat(result.getHabitId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("取消打卡 - 不存在的记录抛异常")
    void cancelCheckIn_notFound_throws() {
        Habit h = new Habit();
        h.setId(1L);
        h.setUserId(1L);
        when(habitRepository.findById(1L)).thenReturn(Optional.of(h));
        when(habitRecordRepository.findByHabitIdAndCheckDate(eq(1L), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> habitService.cancelCheckIn(1L, 1L, LocalDate.now()))
                .isInstanceOf(BusinessException.class)
                .hasMessage("未找到打卡记录");
    }

    @Test
    @DisplayName("取消打卡 - 正常")
    void cancelCheckIn_succeeds() {
        Habit h = new Habit();
        h.setId(1L);
        h.setUserId(1L);
        HabitRecord r = new HabitRecord();
        r.setId(99L);
        when(habitRepository.findById(1L)).thenReturn(Optional.of(h));
        when(habitRecordRepository.findByHabitIdAndCheckDate(eq(1L), any())).thenReturn(Optional.of(r));
        when(habitRecordRepository.countByHabitIdAndCheckDateAfter(eq(1L), any())).thenReturn(0L);
        when(habitRecordRepository.findByHabitId(1L)).thenReturn(new java.util.ArrayList<>());

        habitService.cancelCheckIn(1L, 1L, LocalDate.now());

        verify(habitRecordRepository).delete(r);
    }

    @Test
    @DisplayName("按日期范围获取打卡记录")
    void getRecordsByDateRange_succeeds() {
        Habit h = new Habit();
        h.setId(1L);
        h.setUserId(1L);
        when(habitRepository.findById(1L)).thenReturn(Optional.of(h));
        HabitRecord r = new HabitRecord();
        when(habitRecordRepository.findByHabitIdAndCheckDateBetween(eq(1L), any(), any())).thenReturn(List.of(r));

        List<HabitRecord> result = habitService.getRecordsByDateRange(1L, 1L, LocalDate.now().minusDays(7), LocalDate.now());

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("获取今日所有习惯的打卡记录")
    void getTodayRecords_succeeds() {
        HabitRecord r = new HabitRecord();
        when(habitRecordRepository.findByUserIdAndCheckDate(1L, LocalDate.now())).thenReturn(List.of(r));

        List<HabitRecord> result = habitService.getTodayRecords(1L);

        assertThat(result).hasSize(1);
    }
}
