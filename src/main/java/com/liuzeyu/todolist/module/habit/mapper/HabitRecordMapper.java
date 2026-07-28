package com.liuzeyu.todolist.module.habit.mapper;

import com.liuzeyu.todolist.module.habit.entity.HabitRecord;
import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;

/**
 * 习惯打卡记录数据访问层（MyBatis Mapper）
 * <p>
 * 提供打卡记录的 CRUD、按习惯/用户/日期查询、以及统计功能。
 */
@Mapper
public interface HabitRecordMapper {

    /**
     * 根据 ID 查询打卡记录
     *
     * @param id 记录 ID
     * @return 打卡记录
     */
    @Select("SELECT * FROM habit_records WHERE id = #{id}")
    HabitRecord findById(Long id);

    /**
     * 查询习惯的所有打卡记录
     *
     * @param habitId 习惯 ID
     * @return 打卡记录列表
     */
    @Select("SELECT * FROM habit_records WHERE habit_id = #{habitId}")
    List<HabitRecord> findByHabitId(Long habitId);

    /**
     * 查询用户的所有打卡记录
     *
     * @param userId 用户 ID
     * @return 打卡记录列表
     */
    @Select("SELECT * FROM habit_records WHERE user_id = #{userId}")
    List<HabitRecord> findByUserId(Long userId);

    /**
     * 查询习惯在指定日期的打卡记录（用于去重）
     *
     * @param habitId   习惯 ID
     * @param checkDate 打卡日期
     * @return 打卡记录，不存在返回 null
     */
    @Select("SELECT * FROM habit_records WHERE habit_id = #{habitId} AND check_date = #{checkDate}")
    HabitRecord findByHabitIdAndCheckDate(@Param("habitId") Long habitId, @Param("checkDate") LocalDate checkDate);

    /**
     * 查询习惯在日期范围内的打卡记录
     *
     * @param habitId   习惯 ID
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @return 打卡记录列表
     */
    @Select("SELECT * FROM habit_records WHERE habit_id = #{habitId} AND check_date BETWEEN #{startDate} AND #{endDate}")
    List<HabitRecord> findByHabitIdAndCheckDateBetween(@Param("habitId") Long habitId,
                                                        @Param("startDate") LocalDate startDate,
                                                        @Param("endDate") LocalDate endDate);

    /**
     * 查询用户在指定日期的所有打卡记录
     *
     * @param userId    用户 ID
     * @param checkDate 日期
     * @return 打卡记录列表
     */
    @Select("SELECT * FROM habit_records WHERE user_id = #{userId} AND check_date = #{checkDate}")
    List<HabitRecord> findByUserIdAndCheckDate(@Param("userId") Long userId, @Param("checkDate") LocalDate checkDate);

    /**
     * 统计习惯在指定日期之后的打卡次数
     *
     * @param habitId 习惯 ID
     * @param date    起始日期
     * @return 打卡次数
     */
    @Select("SELECT COUNT(*) FROM habit_records WHERE habit_id = #{habitId} AND check_date >= #{date}")
    long countByHabitIdAndCheckDateAfter(@Param("habitId") Long habitId, @Param("date") LocalDate date);

    /**
     * 插入打卡记录
     *
     * @param record 打卡记录
     * @return 影响行数
     */
    @Insert("INSERT INTO habit_records(habit_id, check_date, completion_value, note, is_makeup, user_id, created_at) " +
            "VALUES(#{habitId}, #{checkDate}, #{completionValue}, #{note}, #{isMakeup}, #{userId}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(HabitRecord record);

    /**
     * 更新打卡记录
     *
     * @param record 打卡记录
     * @return 影响行数
     */
    @Update("UPDATE habit_records SET completion_value=#{completionValue}, note=#{note}, is_makeup=#{isMakeup} WHERE id=#{id}")
    int update(HabitRecord record);

    /**
     * 删除打卡记录
     *
     * @param id 记录 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM habit_records WHERE id = #{id}")
    int deleteById(Long id);

    /**
     * 删除习惯的所有打卡记录
     *
     * @param habitId 习惯 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM habit_records WHERE habit_id = #{habitId}")
    int deleteByHabitId(Long habitId);
}
