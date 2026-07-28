package com.liuzeyu.todolist.module.habit.service;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.habit.entity.Habit;
import com.liuzeyu.todolist.module.habit.entity.HabitRecord;
import com.liuzeyu.todolist.module.habit.mapper.HabitMapper;
import com.liuzeyu.todolist.module.habit.mapper.HabitRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 习惯服务 — 习惯 CRUD、打卡、统计计算
 * <p>
 * 提供习惯的完整管理功能，包括打卡（checkIn）、取消打卡（cancelCheckIn）、
 * 连续天数计算（calculateStreak）、统计更新等核心逻辑。
 * 打卡时自动更新习惯的 currentStreak、maxStreak、totalCompletions 统计字段。
 */
@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitMapper habitMapper;
    private final HabitRecordMapper habitRecordMapper;

    /**
     * 创建习惯
     *
     * @param userId 用户 ID
     * @param habit  习惯实体（前端传入）
     * @return 创建后的习惯
     */
    public Habit createHabit(Long userId, Habit habit) {
        habit.setUserId(userId);
        habit.setCurrentStreak(0);
        habit.setMaxStreak(0);
        habit.setTotalCompletions(0);
        habitMapper.insert(habit);
        return habit;
    }

    /**
     * 获取用户的习惯列表
     *
     * @param userId 用户 ID
     * @return 习惯列表
     */
    public List<Habit> getHabits(Long userId) {
        return habitMapper.findByUserId(userId);
    }

    /**
     * 获取习惯详情（含权限校验）
     *
     * @param userId  用户 ID
     * @param habitId 习惯 ID
     * @return 习惯实体
     * @throws BusinessException 404 不存在，403 无权访问
     */
    public Habit getHabit(Long userId, Long habitId) {
        Habit habit = habitMapper.findById(habitId);
        if (habit == null) {
            throw new BusinessException(404, "习惯不存在");
        }
        
        if (!habit.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权访问该习惯");
        }
        
        return habit;
    }

    /**
     * 更新习惯
     *
     * @param userId   用户 ID
     * @param habitId  习惯 ID
     * @param habitData 更新数据
     * @return 更新后的习惯
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
        
        habitMapper.update(habit);
        return habit;
    }

    /**
     * 删除习惯（级联删除打卡记录）
     *
     * @param userId  用户 ID
     * @param habitId 习惯 ID
     */
    @Transactional
    public void deleteHabit(Long userId, Long habitId) {
        Habit habit = getHabit(userId, habitId);
        
        // 删除相关的打卡记录
        habitRecordMapper.deleteByHabitId(habitId);
        
        habitMapper.deleteById(habit.getId());
    }

    /**
     * 打卡
     *
     * @param userId          用户 ID
     * @param habitId         习惯 ID
     * @param checkDate       打卡日期
     * @param completionValue 完成值
     * @param note            备注
     * @param isMakeup        是否补卡
     * @return 打卡记录
     * @throws BusinessException 409 当天已打卡（非补卡模式）
     */
    @Transactional
    public HabitRecord checkIn(Long userId, Long habitId, LocalDate checkDate, 
                               Double completionValue, String note, Boolean isMakeup) {
        Habit habit = getHabit(userId, habitId);
        
        // 检查是否已经打卡（非补卡模式下同一天不能重复打卡）
        if (!Boolean.TRUE.equals(isMakeup) && habitRecordMapper.findByHabitIdAndCheckDate(habitId, checkDate) != null) {
            throw new BusinessException(409, "今天已经打卡过了");
        }
        
        // 创建打卡记录
        HabitRecord record = new HabitRecord();
        record.setHabitId(habitId);
        record.setCheckDate(checkDate);
        record.setCompletionValue(completionValue != null ? completionValue : 1.0);
        record.setNote(note);
        record.setIsMakeup(isMakeup != null ? isMakeup : false);
        record.setUserId(userId);
        
        habitRecordMapper.insert(record);
        
        // 更新习惯统计
        updateHabitStats(habit);
        
        return record;
    }

    /**
     * 取消打卡
     *
     * @param userId    用户 ID
     * @param habitId   习惯 ID
     * @param checkDate 打卡日期
     * @throws BusinessException 404 未找到打卡记录
     */
    @Transactional
    public void cancelCheckIn(Long userId, Long habitId, LocalDate checkDate) {
        Habit habit = getHabit(userId, habitId);
        
        HabitRecord record = habitRecordMapper.findByHabitIdAndCheckDate(habitId, checkDate);
        if (record == null) {
            throw new BusinessException(404, "未找到打卡记录");
        }
        
        habitRecordMapper.deleteById(record.getId());
        
        // 重新计算统计
        recalculateHabitStats(habit);
    }

    /**
     * 获取打卡记录
     *
     * @param userId  用户 ID
     * @param habitId 习惯 ID
     * @return 打卡记录列表
     */
    public List<HabitRecord> getRecords(Long userId, Long habitId) {
        Habit habit = getHabit(userId, habitId);
        return habitRecordMapper.findByHabitId(habitId);
    }

    /**
     * 获取指定日期范围的打卡记录
     *
     * @param userId    用户 ID
     * @param habitId   习惯 ID
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @return 打卡记录列表
     */
    public List<HabitRecord> getRecordsByDateRange(Long userId, Long habitId, 
                                                     LocalDate startDate, LocalDate endDate) {
        Habit habit = getHabit(userId, habitId);
        return habitRecordMapper.findByHabitIdAndCheckDateBetween(habitId, startDate, endDate);
    }

    /**
     * 更新习惯统计（打卡后调用）
     *
     * @param habit 习惯实体
     */
    private void updateHabitStats(Habit habit) {
        long totalCompletions = habitRecordMapper.countByHabitIdAndCheckDateAfter(
                habit.getId(), LocalDate.now().minusYears(1));
        
        habit.setTotalCompletions((int) totalCompletions);
        
        // 计算连续天数
        int streak = calculateStreak(habit.getId());
        habit.setCurrentStreak(streak);
        if (streak > habit.getMaxStreak()) {
            habit.setMaxStreak(streak);
        }
        
        habitMapper.update(habit);
    }

    /**
     * 重新计算习惯统计（取消打卡后调用）
     *
     * @param habit 习惯实体
     */
    private void recalculateHabitStats(Habit habit) {
        long totalCompletions = habitRecordMapper.countByHabitIdAndCheckDateAfter(
                habit.getId(), LocalDate.now().minusYears(1));
        
        habit.setTotalCompletions((int) totalCompletions);
        int streak = calculateStreak(habit.getId());
        habit.setCurrentStreak(streak);
        
        habitMapper.update(habit);
    }

    /**
     * 计算连续天数
     * <p>
     * 从最近一次打卡开始向前追溯，如果最近一次打卡不是今天或昨天则返回 0。
     * 按日期降序排列，检查是否连续（相邻日期差 1 天）。
     *
     * @param habitId 习惯 ID
     * @return 连续天数
     */
    private int calculateStreak(Long habitId) {
        List<HabitRecord> records = habitRecordMapper.findByHabitId(habitId);
        if (records.isEmpty()) {
            return 0;
        }
        
        // 按日期降序排列
        records.sort((a, b) -> b.getCheckDate().compareTo(a.getCheckDate()));
        
        int streak = 1;
        LocalDate today = LocalDate.now();
        LocalDate lastDate = records.get(0).getCheckDate();
        
        // 如果最后一次打卡不是今天或昨天，则连续天数为 0
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
     *
     * @param userId 用户 ID
     * @return 今日打卡记录列表
     */
    public List<HabitRecord> getTodayRecords(Long userId) {
        LocalDate today = LocalDate.now();
        return habitRecordMapper.findByUserIdAndCheckDate(userId, today);
    }
}
