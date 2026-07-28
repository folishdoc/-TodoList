package com.liuzeyu.todolist.module.habit.mapper;

import com.liuzeyu.todolist.module.habit.entity.Habit;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 习惯数据访问层（MyBatis Mapper）
 * <p>
 * 提供习惯的 CRUD、按用户查询、按名称搜索功能。
 */
@Mapper
public interface HabitMapper {

    /**
     * 根据 ID 查询习惯
     *
     * @param id 习惯 ID
     * @return 习惯实体
     */
    @Select("SELECT * FROM habits WHERE id = #{id}")
    Habit findById(Long id);

    /**
     * 查询用户的所有习惯
     *
     * @param userId 用户 ID
     * @return 习惯列表
     */
    @Select("SELECT * FROM habits WHERE user_id = #{userId}")
    List<Habit> findByUserId(Long userId);

    /**
     * 按名称搜索习惯
     *
     * @param userId  用户 ID
     * @param keyword 关键词
     * @return 匹配的习惯列表
     */
    @Select("SELECT * FROM habits WHERE user_id = #{userId} AND name LIKE CONCAT('%', #{keyword}, '%')")
    List<Habit> findByUserIdAndNameContaining(@Param("userId") Long userId, @Param("keyword") String keyword);

    /**
     * 查询所有习惯（全表扫描，定时任务用）
     *
     * @return 所有习惯
     */
    @Select("SELECT * FROM habits")
    List<Habit> findAll();

    /**
     * 插入习惯
     *
     * @param habit 习惯实体
     * @return 影响行数
     */
    @Insert("INSERT INTO habits(name, icon, color, target_type, target_value, frequency, custom_days, " +
            "time_period, start_time, end_time, reminder_enabled, reminder_time, " +
            "is_archived, sort_order, user_id, created_at, updated_at) " +
            "VALUES(#{name}, #{icon}, #{color}, #{targetType}, #{targetValue}, #{frequency}, #{customDays}, " +
            "#{timePeriod}, #{startTime}, #{endTime}, #{reminderEnabled}, #{reminderTime}, " +
            "#{isArchived}, #{sortOrder}, #{userId}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Habit habit);

    /**
     * 更新习惯
     *
     * @param habit 习惯实体
     * @return 影响行数
     */
    @Update("UPDATE habits SET name=#{name}, icon=#{icon}, color=#{color}, target_type=#{targetType}, " +
            "target_value=#{targetValue}, frequency=#{frequency}, custom_days=#{customDays}, " +
            "time_period=#{timePeriod}, start_time=#{startTime}, end_time=#{endTime}, " +
            "reminder_enabled=#{reminderEnabled}, reminder_time=#{reminderTime}, " +
            "is_archived=#{isArchived}, sort_order=#{sortOrder}, updated_at=NOW() WHERE id=#{id}")
    int update(Habit habit);

    /**
     * 删除习惯
     *
     * @param id 习惯 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM habits WHERE id = #{id}")
    int deleteById(Long id);
}
