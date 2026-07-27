package com.liuzeyu.todolist.module.list.mapper;

import com.liuzeyu.todolist.module.list.entity.TaskList;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface TaskListMapper {

    @Select("SELECT * FROM task_lists WHERE id = #{id}")
    TaskList findById(Long id);

    @Select("SELECT * FROM task_lists WHERE user_id = #{userId}")
    List<TaskList> findByUserId(Long userId);

    @Select("SELECT * FROM task_lists WHERE user_id = #{userId} ORDER BY sort_order ASC")
    List<TaskList> findByUserIdOrderBySortOrderAsc(Long userId);

    @Select("SELECT * FROM task_lists WHERE user_id = #{userId} AND is_default = 1")
    List<TaskList> findByUserIdAndIsDefaultTrue(Long userId);

    @Select("SELECT * FROM task_lists")
    List<TaskList> findAll();

    @Insert("INSERT INTO task_lists(user_id, name, color, sort_order, is_default, created_at, updated_at) " +
            "VALUES(#{userId}, #{name}, #{color}, #{sortOrder}, #{isDefault}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(TaskList taskList);

    @Update("UPDATE task_lists SET name=#{name}, color=#{color}, sort_order=#{sortOrder}, " +
            "is_default=#{isDefault}, updated_at=NOW() WHERE id=#{id}")
    int update(TaskList taskList);

    @Delete("DELETE FROM task_lists WHERE id = #{id}")
    int deleteById(Long id);
}
