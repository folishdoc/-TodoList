package com.liuzeyu.todolist.module.anniversary.mapper;

import com.liuzeyu.todolist.module.anniversary.entity.Anniversary;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface AnniversaryMapper {

    @Select("SELECT * FROM anniversaries WHERE id = #{id}")
    Anniversary findById(Long id);

    @Select("SELECT * FROM anniversaries WHERE user_id = #{userId}")
    List<Anniversary> findAllByUserId(Long userId);

    @Select("SELECT * FROM anniversaries WHERE user_id = #{userId} AND name LIKE CONCAT('%', #{keyword}, '%')")
    List<Anniversary> searchByName(@Param("userId") Long userId, @Param("keyword") String keyword);

    @Select("SELECT * FROM anniversaries WHERE user_id = #{userId} AND remind_enabled = 1")
    List<Anniversary> findRemindEnabledByUserId(Long userId);

    @Insert("INSERT INTO anniversaries(user_id, name, date, type, remind_enabled, remind_days_before, " +
            "description, color, created_at, updated_at) " +
            "VALUES(#{userId}, #{name}, #{date}, #{type}, #{remindEnabled}, #{remindDaysBefore}, " +
            "#{description}, #{color}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Anniversary anniversary);

    @Update("UPDATE anniversaries SET name=#{name}, date=#{date}, type=#{type}, " +
            "remind_enabled=#{remindEnabled}, remind_days_before=#{remindDaysBefore}, " +
            "description=#{description}, color=#{color}, updated_at=NOW() WHERE id=#{id}")
    int update(Anniversary anniversary);

    @Delete("DELETE FROM anniversaries WHERE id = #{id}")
    int deleteById(Long id);
}
