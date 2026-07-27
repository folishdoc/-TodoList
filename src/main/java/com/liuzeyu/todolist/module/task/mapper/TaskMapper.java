package com.liuzeyu.todolist.module.task.mapper;

import com.liuzeyu.todolist.module.task.entity.Task;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface TaskMapper {

    // ── 简单 CRUD ──
    @Select("SELECT * FROM tasks WHERE id = #{id}")
    Task findById(Long id);

    @Select("SELECT * FROM tasks WHERE user_id = #{userId} AND id IN (${ids})")
    List<Task> findAllByIds(@Param("userId") Long userId, @Param("ids") String ids);

    @Select("SELECT * FROM tasks")
    List<Task> findAll();

    @Insert("INSERT INTO tasks(user_id, list_id, parent_id, title, description, priority, status, " +
            "due_date, start_date, reminder_time, repeat_rule, completed_at, sort_order, created_at, updated_at) " +
            "VALUES(#{userId}, #{listId}, #{parentId}, #{title}, #{description}, #{priority}, #{status}, " +
            "#{dueDate}, #{startDate}, #{reminderTime}, #{repeatRule}, #{completedAt}, #{sortOrder}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Task task);

    @Update("UPDATE tasks SET list_id=#{listId}, parent_id=#{parentId}, title=#{title}, " +
            "description=#{description}, priority=#{priority}, status=#{status}, " +
            "due_date=#{dueDate}, start_date=#{startDate}, reminder_time=#{reminderTime}, " +
            "repeat_rule=#{repeatRule}, completed_at=#{completedAt}, sort_order=#{sortOrder}, " +
            "updated_at=NOW() WHERE id=#{id}")
    int update(Task task);

    @Delete("DELETE FROM tasks WHERE id = #{id}")
    int deleteById(Long id);

    // ── 派生查询 ──
    List<Task> findByUserId(@Param("userId") Long userId, @Param("offset") int offset, @Param("limit") int limit);
    long countByUserId(@Param("userId") Long userId);

    @Select("SELECT * FROM tasks WHERE user_id = #{userId}")
    List<Task> findAllByUserId(Long userId);

    @Select("SELECT * FROM tasks WHERE user_id = #{userId} AND status = #{status}")
    List<Task> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Integer status);

    @Select("SELECT * FROM tasks WHERE user_id = #{userId} AND list_id = #{listId}")
    List<Task> findByUserIdAndListId(@Param("userId") Long userId, @Param("listId") Long listId);

    @Select("SELECT * FROM tasks WHERE user_id = #{userId} AND parent_id = #{parentId}")
    List<Task> findByUserIdAndParentId(@Param("userId") Long userId, @Param("parentId") Long parentId);

    List<Task> findByUserIdAndParentIdIn(@Param("userId") Long userId, @Param("parentIds") List<Long> parentIds);

    // ── 自定义查询 (XML 实现) ──
    List<Task> findTodayTasks(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    List<Task> findUpcomingTasks(@Param("userId") Long userId, @Param("date") LocalDateTime date);
    List<Task> searchTasks(@Param("userId") Long userId, @Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);
    long countSearchTasks(@Param("userId") Long userId, @Param("keyword") String keyword);
    List<Task> findByDateRange(@Param("userId") Long userId, @Param("rangeStart") LocalDateTime rangeStart, @Param("rangeEnd") LocalDateTime rangeEnd);

    // ── 统计聚合 (XML 实现) ──
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Integer status);
    List<Object[]> countByUserIdGroupByPriority(@Param("userId") Long userId);
    long countByUserIdAndDueDateBetween(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    long countByUserIdAndDueDateAfter(@Param("userId") Long userId, @Param("date") LocalDateTime date);
    List<Object[]> countByUserIdGroupByListId(@Param("userId") Long userId);
    List<Object[]> countCreatedByDateAfter(@Param("userId") Long userId, @Param("start") LocalDateTime start);
    List<Object[]> countCompletedByDateAfter(@Param("userId") Long userId, @Param("start") LocalDateTime start);

    // ── 批量操作 ──
    int batchUpdate(@Param("tasks") List<Task> tasks);
    int batchDeleteByIds(@Param("ids") List<Long> ids);
}
