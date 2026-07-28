package com.liuzeyu.todolist.module.list.mapper;

import com.liuzeyu.todolist.module.list.entity.TaskList;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 清单数据访问层（MyBatis Mapper）
 * <p>
 * 提供清单的 CRUD、按用户查询（支持排序）、查询默认清单等功能。
 */
@Mapper
public interface TaskListMapper {

    /**
     * 根据 ID 查询清单
     *
     * @param id 清单 ID
     * @return 清单实体
     */
    @Select("SELECT * FROM task_lists WHERE id = #{id}")
    TaskList findById(Long id);

    /**
     * 查询用户的所有清单
     *
     * @param userId 用户 ID
     * @return 清单列表
     */
    @Select("SELECT * FROM task_lists WHERE user_id = #{userId}")
    List<TaskList> findByUserId(Long userId);

    /**
     * 查询用户的所有清单（按 sort_order 升序）
     *
     * @param userId 用户 ID
     * @return 排序后的清单列表
     */
    @Select("SELECT * FROM task_lists WHERE user_id = #{userId} ORDER BY sort_order ASC")
    List<TaskList> findByUserIdOrderBySortOrderAsc(Long userId);

    /**
     * 查询用户的默认清单
     *
     * @param userId 用户 ID
     * @return 默认清单列表（通常只有一个）
     */
    @Select("SELECT * FROM task_lists WHERE user_id = #{userId} AND is_default = 1")
    List<TaskList> findByUserIdAndIsDefaultTrue(Long userId);

    /**
     * 查询所有清单（全表扫描）
     *
     * @return 所有清单
     */
    @Select("SELECT * FROM task_lists")
    List<TaskList> findAll();

    /**
     * 插入清单
     *
     * @param taskList 清单实体
     * @return 影响行数
     */
    @Insert("INSERT INTO task_lists(user_id, name, color, sort_order, is_default, created_at, updated_at) " +
            "VALUES(#{userId}, #{name}, #{color}, #{sortOrder}, #{isDefault}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(TaskList taskList);

    /**
     * 更新清单
     *
     * @param taskList 清单实体
     * @return 影响行数
     */
    @Update("UPDATE task_lists SET name=#{name}, color=#{color}, sort_order=#{sortOrder}, " +
            "is_default=#{isDefault}, updated_at=NOW() WHERE id=#{id}")
    int update(TaskList taskList);

    /**
     * 删除清单
     *
     * @param id 清单 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM task_lists WHERE id = #{id}")
    int deleteById(Long id);
}
