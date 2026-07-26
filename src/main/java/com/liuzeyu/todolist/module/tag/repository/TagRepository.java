package com.liuzeyu.todolist.module.tag.repository;

import com.liuzeyu.todolist.module.tag.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 标签Repository
 */
@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    
    /**
     * 根据用户ID查询所有标签
     */
    List<Tag> findByUserId(Long userId);
    
    /**
     * 根据用户ID和标签名查询
     */
    Tag findByUserIdAndName(Long userId, String name);
}
