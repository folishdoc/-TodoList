package com.liuzeyu.todolist.module.list.mapper;

import com.liuzeyu.todolist.module.list.entity.TaskList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 清单Repository
 */
@Repository
public interface TaskListRepository extends JpaRepository<TaskList, Long> {
    List<TaskList> findByUserId(Long userId);  // 获取用户所有清单
    List<TaskList> findByUserIdOrderBySortOrderAsc(Long userId);
    List<TaskList> findByUserIdAndIsDefaultTrue(Long userId);
}
