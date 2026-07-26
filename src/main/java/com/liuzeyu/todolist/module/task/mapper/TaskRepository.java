package com.liuzeyu.todolist.module.task.mapper;

import com.liuzeyu.todolist.module.task.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 任务Repository
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    Page<Task> findByUserId(Long userId, Pageable pageable);
    List<Task> findAllByUserId(Long userId);  // 获取用户所有任务（不分页）
    List<Task> findByUserIdAndStatus(Long userId, Integer status);
    List<Task> findByUserIdAndListId(Long userId, Long listId);
    List<Task> findByUserIdAndParentId(Long userId, Long parentId); // 获取子任务
    List<Task> findByUserIdAndParentIdIn(Long userId, List<Long> parentIds); // 批量获取子任务
    
    @Query("SELECT t FROM Task t WHERE t.userId = :userId AND t.status = 0 AND "
        + "(t.startDate IS NULL OR t.startDate < :end) AND "
        + "(t.dueDate IS NULL OR t.dueDate >= :start) "
        + "ORDER BY t.priority DESC, t.sortOrder ASC")
    List<Task> findTodayTasks(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT t FROM Task t WHERE t.userId = :userId AND t.dueDate >= :date ORDER BY t.dueDate ASC, t.priority DESC")
    List<Task> findUpcomingTasks(@Param("userId") Long userId, @Param("date") LocalDateTime date);
    
    @Query("SELECT t FROM Task t WHERE t.userId = :userId AND (:keyword IS NULL OR t.title LIKE %:keyword% OR t.description LIKE %:keyword%) ORDER BY t.createdAt DESC")
    Page<Task> searchTasks(@Param("userId") Long userId, @Param("keyword") String keyword, Pageable pageable);

    // === Aggregation queries for statistics ===
    @Query("SELECT COUNT(t) FROM Task t WHERE t.userId = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.userId = :userId AND t.status = :status")
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Integer status);

    @Query("SELECT t.priority, COUNT(t) FROM Task t WHERE t.userId = :userId GROUP BY t.priority")
    List<Object[]> countByUserIdGroupByPriority(@Param("userId") Long userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.userId = :userId AND t.dueDate >= :start AND t.dueDate < :end")
    long countByUserIdAndDueDateBetween(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.userId = :userId AND t.dueDate > :date")
    long countByUserIdAndDueDateAfter(@Param("userId") Long userId, @Param("date") LocalDateTime date);

    @Query("SELECT t.listId, COUNT(t) FROM Task t WHERE t.userId = :userId AND t.listId IS NOT NULL GROUP BY t.listId")
    List<Object[]> countByUserIdGroupByListId(@Param("userId") Long userId);

    @Query("SELECT CAST(t.createdAt AS LocalDate), COUNT(t) FROM Task t WHERE t.userId = :userId AND t.createdAt >= :start GROUP BY CAST(t.createdAt AS LocalDate)")
    List<Object[]> countCreatedByDateAfter(@Param("userId") Long userId, @Param("start") LocalDateTime start);

    @Query("SELECT CAST(t.completedAt AS LocalDate), COUNT(t) FROM Task t WHERE t.userId = :userId AND t.completedAt >= :start GROUP BY CAST(t.completedAt AS LocalDate)")
    List<Object[]> countCompletedByDateAfter(@Param("userId") Long userId, @Param("start") LocalDateTime start);

    @Query("SELECT t FROM Task t WHERE t.userId = :userId AND "
        + "((t.startDate >= :rangeStart AND t.startDate < :rangeEnd) OR "
        + " (t.dueDate >= :rangeStart AND t.dueDate < :rangeEnd) OR "
        + " (t.startDate <= :rangeStart AND t.dueDate >= :rangeEnd)) "
        + "ORDER BY t.priority DESC, t.sortOrder ASC")
    List<Task> findByDateRange(@Param("userId") Long userId,
                               @Param("rangeStart") LocalDateTime rangeStart,
                               @Param("rangeEnd") LocalDateTime rangeEnd);
}
