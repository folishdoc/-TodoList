package com.liuzeyu.todolist.module.anniversary.mapper;

import com.liuzeyu.todolist.module.anniversary.entity.Anniversary;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 纪念日数据访问层（MyBatis Mapper）
 * <p>
 * 提供纪念日的 CRUD、搜索、以及查询已启用提醒的纪念日功能。
 */
@Mapper
public interface AnniversaryMapper {

    /**
     * 根据 ID 查询纪念日
     *
     * @param id 纪念日 ID
     * @return 纪念日实体
     */
    @Select("SELECT * FROM anniversaries WHERE id = #{id}")
    Anniversary findById(Long id);

    /**
     * 查询用户的所有纪念日
     *
     * @param userId 用户 ID
     * @return 纪念日列表
     */
    @Select("SELECT * FROM anniversaries WHERE user_id = #{userId}")
    List<Anniversary> findAllByUserId(Long userId);

    /**
     * 按名称搜索纪念日
     *
     * @param userId  用户 ID
     * @param keyword 关键词
     * @return 匹配的纪念日列表
     */
    @Select("SELECT * FROM anniversaries WHERE user_id = #{userId} AND name LIKE CONCAT('%', #{keyword}, '%')")
    List<Anniversary> searchByName(@Param("userId") Long userId, @Param("keyword") String keyword);

    /**
     * 查询已启用提醒的纪念日（定时任务用）
     *
     * @param userId 用户 ID
     * @return 纪念日列表
     */
    @Select("SELECT * FROM anniversaries WHERE user_id = #{userId} AND remind_enabled IS TRUE")
    List<Anniversary> findRemindEnabledByUserId(Long userId);

    /**
     * 插入纪念日
     *
     * @param anniversary 纪念日实体
     * @return 影响行数
     */
    @Insert("INSERT INTO anniversaries(user_id, name, date, type, remind_enabled, remind_days_before, " +
            "description, color, created_at, updated_at) " +
            "VALUES(#{userId}, #{name}, #{date}, #{type}, #{remindEnabled}, #{remindDaysBefore}, " +
            "#{description}, #{color}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Anniversary anniversary);

    /**
     * 更新纪念日
     *
     * @param anniversary 纪念日实体
     * @return 影响行数
     */
    @Update("UPDATE anniversaries SET name=#{name}, date=#{date}, type=#{type}, " +
            "remind_enabled=#{remindEnabled}, remind_days_before=#{remindDaysBefore}, " +
            "description=#{description}, color=#{color}, updated_at=NOW() WHERE id=#{id}")
    int update(Anniversary anniversary);

    /**
     * 删除纪念日
     *
     * @param id 纪念日 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM anniversaries WHERE id = #{id}")
    int deleteById(Long id);
}
