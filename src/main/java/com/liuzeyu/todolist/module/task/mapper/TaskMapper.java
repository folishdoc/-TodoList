package com.liuzeyu.todolist.module.task.mapper;

import com.liuzeyu.todolist.module.task.entity.Task;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 任务数据访问层（MyBatis Mapper）
 * <p>
 * 提供任务的 CRUD、派生查询（今日/未来/搜索/日期范围）、统计聚合（按优先级/清单分组）、
 * 以及批量操作（batchUpdate/batchDeleteByIds）功能。
 * 部分复杂查询在 resources/mapper/TaskMapper.xml 中实现。
 */
@Mapper
public interface TaskMapper {

    // ── 简单 CRUD ──

    /**
     * 根据 ID 查询任务
     *
     * @param id 任务 ID
     * @return 任务实体，不存在返回 null
     */
    @Select("SELECT * FROM tasks WHERE id = #{id}")
    Task findById(Long id);

    /**
     * 根据 ID 列表批量查询（逗号分隔字符串）
     *
     * @param userId 用户 ID（权限过滤）
     * @param ids    逗号分隔的任务 ID 字符串
     * @return 任务列表
     */
    @Select("SELECT * FROM tasks WHERE user_id = #{userId} AND id IN (${ids})")
    List<Task> findAllByIds(@Param("userId") Long userId, @Param("ids") String ids);

    /**
     * 查询所有任务（全表扫描，仅定时任务使用）
     *
     * @return 所有任务
     */
    @Select("SELECT * FROM tasks")
    List<Task> findAll();

    /**
     * 插入新任务
     *
     * @param task 任务实体（插入后 id 被自动回填）
     * @return 影响行数
     */
    @Insert("INSERT INTO tasks(user_id, list_id, parent_id, title, description, priority, status, " +
            "due_date, start_date, reminder_time, repeat_rule, completed_at, sort_order, created_at, updated_at) " +
            "VALUES(#{userId}, #{listId}, #{parentId}, #{title}, #{description}, #{priority}, #{status}, " +
            "#{dueDate}, #{startDate}, #{reminderTime}, #{repeatRule}, #{completedAt}, #{sortOrder}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Task task);

    /**
     * 更新任务
     *
     * @param task 任务实体（根据 id 更新）
     * @return 影响行数
     */
    @Update("UPDATE tasks SET list_id=#{listId}, parent_id=#{parentId}, title=#{title}, " +
            "description=#{description}, priority=#{priority}, status=#{status}, " +
            "due_date=#{dueDate}, start_date=#{startDate}, reminder_time=#{reminderTime}, " +
            "repeat_rule=#{repeatRule}, completed_at=#{completedAt}, sort_order=#{sortOrder}, " +
            "updated_at=NOW() WHERE id=#{id}")
    int update(Task task);

    /**
     * 删除任务
     *
     * @param id 任务 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM tasks WHERE id = #{id}")
    int deleteById(Long id);

    // ── 派生查询 ──

    /**
     * 分页查询用户的任务
     *
     * @param userId 用户 ID
     * @param offset 偏移量
     * @param limit  每页大小
     * @return 任务列表
     */
    List<Task> findByUserId(@Param("userId") Long userId, @Param("offset") int offset, @Param("limit") int limit);

    /**
     * 统计用户的任务总数
     *
     * @param userId 用户 ID
     * @return 任务总数
     */
    long countByUserId(@Param("userId") Long userId);

    /**
     * 查询用户的所有任务（不分页）
     *
     * @param userId 用户 ID
     * @return 所有任务
     */
    @Select("SELECT * FROM tasks WHERE user_id = #{userId}")
    List<Task> findAllByUserId(Long userId);

    /**
     * 根据状态查询用户的任务
     *
     * @param userId 用户 ID
     * @param status 状态（0=未完成，1=已完成）
     * @return 任务列表
     */
    @Select("SELECT * FROM tasks WHERE user_id = #{userId} AND status = #{status}")
    List<Task> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Integer status);

    /**
     * 根据清单 ID 查询任务
     *
     * @param userId 用户 ID
     * @param listId 清单 ID
     * @return 任务列表
     */
    @Select("SELECT * FROM tasks WHERE user_id = #{userId} AND list_id = #{listId}")
    List<Task> findByUserIdAndListId(@Param("userId") Long userId, @Param("listId") Long listId);

    /**
     * 根据父任务 ID 查询直接子任务
     *
     * @param userId   用户 ID
     * @param parentId 父任务 ID
     * @return 子任务列表
     */
    @Select("SELECT * FROM tasks WHERE user_id = #{userId} AND parent_id = #{parentId}")
    List<Task> findByUserIdAndParentId(@Param("userId") Long userId, @Param("parentId") Long parentId);

    /**
     * 根据多个父任务 ID 批量查询子任务（避免 N+1）
     *
     * @param userId    用户 ID
     * @param parentIds 父任务 ID 列表
     * @return 子任务列表
     */
    List<Task> findByUserIdAndParentIdIn(@Param("userId") Long userId, @Param("parentIds") List<Long> parentIds);

    // ── 自定义查询 (XML 实现) ──

    /**
     * 查询今日任务（未完成、已开始或未设开始日期、未过期或未设截止日期）
     *
     * @param userId 用户 ID
     * @param start  今日开始时间
     * @param end    明日开始时间
     * @return 今日任务列表
     */
    List<Task> findTodayTasks(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 查询未来任务（截止日期在指定时间之后）
     *
     * @param userId 用户 ID
     * @param date   当前时间
     * @return 未来任务列表
     */
    List<Task> findUpcomingTasks(@Param("userId") Long userId, @Param("date") LocalDateTime date);

    /**
     * 搜索任务（标题/描述模糊匹配）
     *
     * @param userId  用户 ID
     * @param keyword 关键词
     * @param offset  偏移量
     * @param limit   每页大小
     * @return 匹配的任务列表
     */
    List<Task> searchTasks(@Param("userId") Long userId, @Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);

    /**
     * 统计搜索匹配的任务总数
     *
     * @param userId  用户 ID
     * @param keyword 关键词
     * @return 匹配数
     */
    long countSearchTasks(@Param("userId") Long userId, @Param("keyword") String keyword);

    /**
     * 查询日期范围内的任务（日历视图用）
     *
     * @param userId     用户 ID
     * @param rangeStart 范围开始
     * @param rangeEnd   范围结束
     * @return 任务列表
     */
    List<Task> findByDateRange(@Param("userId") Long userId, @Param("rangeStart") LocalDateTime rangeStart, @Param("rangeEnd") LocalDateTime rangeEnd);

    // ── 统计聚合 (XML 实现) ──

    /**
     * 按状态统计任务数
     *
     * @param userId 用户 ID
     * @param status 状态
     * @return 任务数
     */
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Integer status);

    /**
     * 按优先级分组统计任务数
     *
     * @param userId 用户 ID
     * @return map 列表（key="key"=priority, key="value"=count）
     */
    List<Map<String, Object>> countByUserIdGroupByPriority(@Param("userId") Long userId);

    /**
     * 统计指定日期范围内的任务数
     *
     * @param userId 用户 ID
     * @param start  开始时间
     * @param end    结束时间
     * @return 任务数
     */
    long countByUserIdAndDueDateBetween(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 统计指定日期之后的任务数
     *
     * @param userId 用户 ID
     * @param date   日期
     * @return 任务数
     */
    long countByUserIdAndDueDateAfter(@Param("userId") Long userId, @Param("date") LocalDateTime date);

    /**
     * 按清单 ID 分组统计任务数
     *
     * @param userId 用户 ID
     * @return map 列表（key="key"=listId, key="value"=count）
     */
    List<Map<String, Object>> countByUserIdGroupByListId(@Param("userId") Long userId);

    /**
     * 统计指定日期之后创建的任务（按日期分组）
     *
     * @param userId 用户 ID
     * @param start  开始时间
     * @return map 列表（key="key"=date, key="value"=count）
     */
    List<Map<String, Object>> countCreatedByDateAfter(@Param("userId") Long userId, @Param("start") LocalDateTime start);

    /**
     * 统计指定日期之后完成的任务（按日期分组）
     *
     * @param userId 用户 ID
     * @param start  开始时间
     * @return map 列表（key="key"=date, key="value"=count）
     */
    List<Map<String, Object>> countCompletedByDateAfter(@Param("userId") Long userId, @Param("start") LocalDateTime start);

    // ── 批量操作 ──

    /**
     * 批量更新任务
     *
     * @param tasks 任务列表
     * @return 影响行数
     */
    int batchUpdate(@Param("tasks") List<Task> tasks);

    /**
     * 批量删除任务
     *
     * @param ids 任务 ID 列表
     * @return 影响行数
     */
    int batchDeleteByIds(@Param("ids") List<Long> ids);
}
