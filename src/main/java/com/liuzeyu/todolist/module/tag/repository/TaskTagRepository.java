package com.liuzeyu.todolist.module.tag.repository;

import com.liuzeyu.todolist.module.tag.entity.TaskTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 任务-标签关联Repository
 */
@Repository
public interface TaskTagRepository extends JpaRepository<TaskTag, Long> {
    
    /**
     * 根据任务ID查询所有关联
     */
    List<TaskTag> findByTaskId(Long taskId);
    
    /**
     * 根据标签ID查询所有关联
     */
    List<TaskTag> findByTagId(Long tagId);
    
    /**
     * 根据任务ID和标签ID查询
     */
    TaskTag findByTaskIdAndTagId(Long taskId, Long tagId);
    
    /**
     * 根据任务ID删除所有关联
     */
    void deleteAllByTaskId(Long taskId);
    
    /**
     * 根据标签ID删除所有关联
     */
    void deleteAllByTagId(Long tagId);
    
    /**
     * 查询任务关联的标签ID列表
     */
    @Query("SELECT tt.tagId FROM TaskTag tt WHERE tt.taskId = :taskId")
    List<Long> findTagIdsByTaskId(Long taskId);
}
