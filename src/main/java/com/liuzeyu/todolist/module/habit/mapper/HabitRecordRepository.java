package com.liuzeyu.todolist.module.habit.mapper;

import com.liuzeyu.todolist.module.habit.entity.HabitRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 习惯打卡记录Repository
 */
@Repository
public interface HabitRecordRepository extends JpaRepository<HabitRecord, Long> {
    
    List<HabitRecord> findByHabitId(Long habitId);
    
    List<HabitRecord> findByUserId(Long userId);
    
    Optional<HabitRecord> findByHabitIdAndCheckDate(Long habitId, LocalDate checkDate);
    
    List<HabitRecord> findByHabitIdAndCheckDateBetween(Long habitId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT COUNT(hr) FROM HabitRecord hr WHERE hr.habitId = :habitId AND hr.checkDate >= :date")
    long countByHabitIdAndCheckDateAfter(Long habitId, LocalDate date);
    
    List<HabitRecord> findByUserIdAndCheckDate(Long userId, LocalDate checkDate);
}
