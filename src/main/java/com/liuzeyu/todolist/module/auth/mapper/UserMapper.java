package com.liuzeyu.todolist.module.auth.mapper;

import com.liuzeyu.todolist.module.auth.entity.User;
import org.apache.ibatis.annotations.*;

import java.util.Optional;

@Mapper
public interface UserMapper {

    @Select("SELECT * FROM users WHERE id = #{id}")
    User findById(Long id);

    @Select("SELECT * FROM users WHERE username = #{username}")
    Optional<User> findByUsername(String username);

    @Select("SELECT COUNT(*) > 0 FROM users WHERE username = #{username}")
    boolean existsByUsername(String username);

    @Insert("INSERT INTO users(username, password, display_name, created_at, updated_at) " +
            "VALUES(#{username}, #{password}, #{displayName}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);

    @Update("UPDATE users SET password=#{password}, display_name=#{displayName}, updated_at=NOW() WHERE id=#{id}")
    int update(User user);

    @Delete("DELETE FROM users WHERE id = #{id}")
    int deleteById(Long id);
}
