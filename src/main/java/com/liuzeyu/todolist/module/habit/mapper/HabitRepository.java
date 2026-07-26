package com.liuzeyu.todolist.module.habit.mapper;

import com.liuzeyu.todolist.module.habit.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 习惯Repository
 */
@Repository
public interface HabitRepository extends JpaRepository<Habit, Long> {
    
    List<Habit> findByUserId(Long userId);
    
    List<Habit> findByUserIdAndNameContaining(Long userId, String keyword);
}
