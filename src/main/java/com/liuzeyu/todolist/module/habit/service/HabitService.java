package com.liuzeyu.todolist.module.habit.service;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.habit.entity.Habit;
import com.liuzeyu.todolist.module.habit.entity.HabitRecord;
import com.liuzeyu.todolist.module.habit.mapper.HabitRepository;
import com.liuzeyu.todolist.module.habit.mapper.HabitRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 习惯服务
 */
@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitRecordRepository habitRecordRepository;

    /**
     * 创建习惯
     */
    public Habit createHabit(Long userId, Habit habit) {
        habit.setUserId(userId);
        habit.setCurrentStreak(0);
        habit.setMaxStreak(0);
        habit.setTotalCompletions(0);
        return habitRepository.save(habit);
    }

    /**
     * 获取用户的习惯列表
     */
    public List<Habit> getHabits(Long userId) {
        return habitRepository.findByUserId(userId);
    }

    /**
     * 获取习惯详情
     */
    public Habit getHabit(Long userId, Long habitId) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new BusinessException("习惯不存在"));
        
        if (!habit.getUserId().equals(userId)) {
            throw new BusinessException("无权访问该习惯");
        }
        
        return habit;
    }

    /**
     * 更新习惯
     */
    public Habit updateHabit(Long userId, Long habitId, Habit habitData) {
        Habit habit = getHabit(userId, habitId);
        
        habit.setName(habitData.getName());
        habit.setIcon(habitData.getIcon());
        habit.setColor(habitData.getColor());
        habit.setTargetType(habitData.getTargetType());
        habit.setTargetValue(habitData.getTargetValue());
        habit.setFrequency(habitData.getFrequency());
        habit.setCustomDays(habitData.getCustomDays());
        habit.setTimePeriod(habitData.getTimePeriod());
        habit.setStartTime(habitData.getStartTime());
        habit.setEndTime(habitData.getEndTime());
        habit.setMinCompletion(habitData.getMinCompletion());
        habit.setStartDate(habitData.getStartDate());
        habit.setEndDate(habitData.getEndDate());
        habit.setRestDays(habitData.getRestDays());
        
        return habitRepository.save(habit);
    }

    /**
     * 删除习惯
     */
    @Transactional
    public void deleteHabit(Long userId, Long habitId) {
        Habit habit = getHabit(userId, habitId);
        
        // 删除相关的打卡记录
        List<HabitRecord> records = habitRecordRepository.findByHabitId(habitId);
        habitRecordRepository.deleteAll(records);
        
        habitRepository.delete(habit);
    }

    /**
     * 打卡
     */
    @Transactional
    public HabitRecord checkIn(Long userId, Long habitId, LocalDate checkDate, 
                               Double completionValue, String note, Boolean isMakeup) {
        Habit habit = getHabit(userId, habitId);
        
        // 检查是否已经打卡
        if (!Boolean.TRUE.equals(isMakeup) && habitRecordRepository.findByHabitIdAndCheckDate(habitId, checkDate).isPresent()) {
            throw new BusinessException("今天已经打卡过了");
        }
        
        // 创建打卡记录
        HabitRecord record = new HabitRecord();
        record.setHabitId(habitId);
        record.setCheckDate(checkDate);
        record.setCompletionValue(completionValue != null ? completionValue : 1.0);
        record.setNote(note);
        record.setIsMakeup(isMakeup != null ? isMakeup : false);
        record.setUserId(userId);
        
        habitRecordRepository.save(record);
        
        // 更新习惯统计
        updateHabitStats(habit);
        
        return record;
    }

    /**
     * 取消打卡
     */
    @Transactional
    public void cancelCheckIn(Long userId, Long habitId, LocalDate checkDate) {
        Habit habit = getHabit(userId, habitId);
        
        HabitRecord record = habitRecordRepository.findByHabitIdAndCheckDate(habitId, checkDate)
                .orElseThrow(() -> new BusinessException("未找到打卡记录"));
        
        habitRecordRepository.delete(record);
        
        // 重新计算统计
        recalculateHabitStats(habit);
    }

    /**
     * 获取打卡记录
     */
    public List<HabitRecord> getRecords(Long userId, Long habitId) {
        Habit habit = getHabit(userId, habitId);
        return habitRecordRepository.findByHabitId(habitId);
    }

    /**
     * 获取指定日期范围的打卡记录
     */
    public List<HabitRecord> getRecordsByDateRange(Long userId, Long habitId, 
                                                    LocalDate startDate, LocalDate endDate) {
        Habit habit = getHabit(userId, habitId);
        return habitRecordRepository.findByHabitIdAndCheckDateBetween(habitId, startDate, endDate);
    }

    /**
     * 更新习惯统计
     */
    private void updateHabitStats(Habit habit) {
        long totalCompletions = habitRecordRepository.countByHabitIdAndCheckDateAfter(
                habit.getId(), LocalDate.now().minusYears(1));
        
        habit.setTotalCompletions((int) totalCompletions);
        
        // 计算连续天数（简化版）
        int streak = calculateStreak(habit.getId());
        habit.setCurrentStreak(streak);
        if (streak > habit.getMaxStreak()) {
            habit.setMaxStreak(streak);
        }
        
        habitRepository.save(habit);
    }

    /**
     * 重新计算习惯统计
     */
    private void recalculateHabitStats(Habit habit) {
        long totalCompletions = habitRecordRepository.countByHabitIdAndCheckDateAfter(
                habit.getId(), LocalDate.now().minusYears(1));
        
        habit.setTotalCompletions((int) totalCompletions);
        int streak = calculateStreak(habit.getId());
        habit.setCurrentStreak(streak);
        
        habitRepository.save(habit);
    }

    /**
     * 计算连续天数
     */
    private int calculateStreak(Long habitId) {
        List<HabitRecord> records = habitRecordRepository.findByHabitId(habitId);
        if (records.isEmpty()) {
            return 0;
        }
        
        // 按日期排序
        records.sort((a, b) -> b.getCheckDate().compareTo(a.getCheckDate()));
        
        int streak = 1;
        LocalDate today = LocalDate.now();
        LocalDate lastDate = records.get(0).getCheckDate();
        
        // 如果最后一次打卡不是今天或昨天，则连续天数为0
        if (lastDate.isBefore(today.minusDays(1))) {
            return 0;
        }
        
        for (int i = 1; i < records.size(); i++) {
            LocalDate currentDate = records.get(i).getCheckDate();
            if (lastDate.minusDays(1).equals(currentDate)) {
                streak++;
                lastDate = currentDate;
            } else {
                break;
            }
        }
        
        return streak;
    }

    /**
     * 获取今日所有习惯的打卡记录
     */
    public List<HabitRecord> getTodayRecords(Long userId) {
        LocalDate today = LocalDate.now();
        return habitRecordRepository.findByUserIdAndCheckDate(userId, today);
    }
}
