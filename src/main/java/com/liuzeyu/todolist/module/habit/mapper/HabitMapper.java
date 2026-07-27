package com.liuzeyu.todolist.module.habit.mapper;

import com.liuzeyu.todolist.module.habit.entity.Habit;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface HabitMapper {

    @Select("SELECT * FROM habits WHERE id = #{id}")
    Habit findById(Long id);

    @Select("SELECT * FROM habits WHERE user_id = #{userId}")
    List<Habit> findByUserId(Long userId);

    @Select("SELECT * FROM habits WHERE user_id = #{userId} AND name LIKE CONCAT('%', #{keyword}, '%')")
    List<Habit> findByUserIdAndNameContaining(@Param("userId") Long userId, @Param("keyword") String keyword);

    @Select("SELECT * FROM habits")
    List<Habit> findAll();

    @Insert("INSERT INTO habits(name, icon, color, target_type, target_value, frequency, custom_days, " +
            "time_period, start_time, end_time, reminder_enabled, reminder_time, " +
            "is_archived, sort_order, user_id, created_at, updated_at) " +
            "VALUES(#{name}, #{icon}, #{color}, #{targetType}, #{targetValue}, #{frequency}, #{customDays}, " +
            "#{timePeriod}, #{startTime}, #{endTime}, #{reminderEnabled}, #{reminderTime}, " +
            "#{isArchived}, #{sortOrder}, #{userId}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Habit habit);

    @Update("UPDATE habits SET name=#{name}, icon=#{icon}, color=#{color}, target_type=#{targetType}, " +
            "target_value=#{targetValue}, frequency=#{frequency}, custom_days=#{customDays}, " +
            "time_period=#{timePeriod}, start_time=#{startTime}, end_time=#{endTime}, " +
            "reminder_enabled=#{reminderEnabled}, reminder_time=#{reminderTime}, " +
            "is_archived=#{isArchived}, sort_order=#{sortOrder}, updated_at=NOW() WHERE id=#{id}")
    int update(Habit habit);

    @Delete("DELETE FROM habits WHERE id = #{id}")
    int deleteById(Long id);
}
