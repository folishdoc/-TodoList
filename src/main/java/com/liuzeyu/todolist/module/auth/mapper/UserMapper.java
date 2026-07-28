package com.liuzeyu.todolist.module.auth.mapper;

import com.liuzeyu.todolist.module.auth.entity.User;
import org.apache.ibatis.annotations.*;

import java.util.Optional;

/**
 * 用户数据访问层（MyBatis Mapper）
 * <p>
 * 提供用户表的 CRUD 操作。使用 MyBatis 注解方式定义 SQL。
 * 单用户模式下主要用于注册和登录流程。
 */
@Mapper
public interface UserMapper {

    /**
     * 根据 ID 查询用户
     *
     * @param id 用户 ID
     * @return 用户实体，不存在返回 null
     */
    @Select("SELECT * FROM users WHERE id = #{id}")
    User findById(Long id);

    /**
     * 根据用户名查询用户（登录用）
     *
     * @param username 用户名
     * @return Optional 包装的用户实体
     */
    @Select("SELECT * FROM users WHERE username = #{username}")
    Optional<User> findByUsername(String username);

    /**
     * 检查用户名是否已存在（注册去重用）
     *
     * @param username 用户名
     * @return true 如果已存在
     */
    @Select("SELECT COUNT(*) > 0 FROM users WHERE username = #{username}")
    boolean existsByUsername(String username);

    /**
     * 插入新用户
     *
     * @param user 用户实体（插入后 id 被自动回填）
     * @return 影响行数
     */
    @Insert("INSERT INTO users(username, password, display_name, created_at, updated_at) " +
            "VALUES(#{username}, #{password}, #{displayName}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);

    /**
     * 更新用户信息
     *
     * @param user 用户实体（根据 id 更新）
     * @return 影响行数
     */
    @Update("UPDATE users SET password=#{password}, display_name=#{displayName}, updated_at=NOW() WHERE id=#{id}")
    int update(User user);

    /**
     * 删除用户
     *
     * @param id 用户 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM users WHERE id = #{id}")
    int deleteById(Long id);
}
