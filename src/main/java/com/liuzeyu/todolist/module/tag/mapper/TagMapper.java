package com.liuzeyu.todolist.module.tag.mapper;

import com.liuzeyu.todolist.module.tag.entity.Tag;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface TagMapper {

    @Select("SELECT * FROM tags WHERE id = #{id}")
    Tag findById(Long id);

    @Select("SELECT * FROM tags WHERE user_id = #{userId}")
    List<Tag> findByUserId(Long userId);

    @Select("SELECT * FROM tags WHERE user_id = #{userId} AND name = #{name}")
    Tag findByUserIdAndName(@Param("userId") Long userId, @Param("name") String name);

    @Select("SELECT * FROM tags")
    List<Tag> findAll();

    @Insert("INSERT INTO tags(name, color, icon, group_name, sort_order, is_pinned, user_id, created_at, updated_at) " +
            "VALUES(#{name}, #{color}, #{icon}, #{groupName}, #{sortOrder}, #{isPinned}, #{userId}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Tag tag);

    @Update("UPDATE tags SET name=#{name}, color=#{color}, icon=#{icon}, group_name=#{groupName}, " +
            "sort_order=#{sortOrder}, is_pinned=#{isPinned}, updated_at=NOW() WHERE id=#{id}")
    int update(Tag tag);

    @Delete("DELETE FROM tags WHERE id = #{id}")
    int deleteById(Long id);

    @Select("<script>" +
            "SELECT * FROM tags WHERE id IN " +
            "<foreach item='id' collection='ids' open='(' separator=',' close=')'>#{id}</foreach>" +
            "</script>")
    List<Tag> findAllByIds(@Param("ids") List<Long> ids);
}
