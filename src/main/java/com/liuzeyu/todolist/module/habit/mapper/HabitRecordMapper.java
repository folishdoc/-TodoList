package com.liuzeyu.todolist.module.habit.mapper;

import com.liuzeyu.todolist.module.habit.entity.HabitRecord;
import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface HabitRecordMapper {

    @Select("SELECT * FROM habit_records WHERE id = #{id}")
    HabitRecord findById(Long id);

    @Select("SELECT * FROM habit_records WHERE habit_id = #{habitId}")
    List<HabitRecord> findByHabitId(Long habitId);

    @Select("SELECT * FROM habit_records WHERE user_id = #{userId}")
    List<HabitRecord> findByUserId(Long userId);

    @Select("SELECT * FROM habit_records WHERE habit_id = #{habitId} AND check_date = #{checkDate}")
    HabitRecord findByHabitIdAndCheckDate(@Param("habitId") Long habitId, @Param("checkDate") LocalDate checkDate);

    @Select("SELECT * FROM habit_records WHERE habit_id = #{habitId} AND check_date BETWEEN #{startDate} AND #{endDate}")
    List<HabitRecord> findByHabitIdAndCheckDateBetween(@Param("habitId") Long habitId,
                                                        @Param("startDate") LocalDate startDate,
                                                        @Param("endDate") LocalDate endDate);

    @Select("SELECT * FROM habit_records WHERE user_id = #{userId} AND check_date = #{checkDate}")
    List<HabitRecord> findByUserIdAndCheckDate(@Param("userId") Long userId, @Param("checkDate") LocalDate checkDate);

    @Select("SELECT COUNT(*) FROM habit_records WHERE habit_id = #{habitId} AND check_date >= #{date}")
    long countByHabitIdAndCheckDateAfter(@Param("habitId") Long habitId, @Param("date") LocalDate date);

    @Insert("INSERT INTO habit_records(habit_id, check_date, completion_value, note, is_makeup, user_id, created_at) " +
            "VALUES(#{habitId}, #{checkDate}, #{completionValue}, #{note}, #{isMakeup}, #{userId}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(HabitRecord record);

    @Update("UPDATE habit_records SET completion_value=#{completionValue}, note=#{note}, is_makeup=#{isMakeup} WHERE id=#{id}")
    int update(HabitRecord record);

    @Delete("DELETE FROM habit_records WHERE id = #{id}")
    int deleteById(Long id);

    @Delete("DELETE FROM habit_records WHERE habit_id = #{habitId}")
    int deleteByHabitId(Long habitId);
}
