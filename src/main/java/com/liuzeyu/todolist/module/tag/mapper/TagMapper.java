package com.liuzeyu.todolist.module.tag.mapper;

import com.liuzeyu.todolist.module.tag.entity.Tag;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 标签数据访问层（MyBatis Mapper）
 * <p>
 * 提供标签的 CRUD、按用户查询、按名称查重、批量 ID 查询等功能。
 */
@Mapper
public interface TagMapper {

    /**
     * 根据 ID 查询标签
     *
     * @param id 标签 ID
     * @return 标签实体
     */
    @Select("SELECT * FROM tags WHERE id = #{id}")
    Tag findById(Long id);

    /**
     * 查询用户的所有标签
     *
     * @param userId 用户 ID
     * @return 标签列表
     */
    @Select("SELECT * FROM tags WHERE user_id = #{userId}")
    List<Tag> findByUserId(Long userId);

    /**
     * 根据名称查询标签（用于查重）
     *
     * @param userId 用户 ID
     * @param name   标签名称
     * @return 标签实体，不存在返回 null
     */
    @Select("SELECT * FROM tags WHERE user_id = #{userId} AND name = #{name}")
    Tag findByUserIdAndName(@Param("userId") Long userId, @Param("name") String name);

    /**
     * 查询所有标签（全表扫描）
     *
     * @return 所有标签
     */
    @Select("SELECT * FROM tags")
    List<Tag> findAll();

    /**
     * 插入标签
     *
     * @param tag 标签实体
     * @return 影响行数
     */
    @Insert("INSERT INTO tags(name, color, icon, group_name, sort_order, is_pinned, user_id, created_at, updated_at) " +
            "VALUES(#{name}, #{color}, #{icon}, #{groupName}, #{sortOrder}, #{isPinned}, #{userId}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Tag tag);

    /**
     * 更新标签
     *
     * @param tag 标签实体
     * @return 影响行数
     */
    @Update("UPDATE tags SET name=#{name}, color=#{color}, icon=#{icon}, group_name=#{groupName}, " +
            "sort_order=#{sortOrder}, is_pinned=#{isPinned}, updated_at=NOW() WHERE id=#{id}")
    int update(Tag tag);

    /**
     * 删除标签
     *
     * @param id 标签 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM tags WHERE id = #{id}")
    int deleteById(Long id);

    /**
     * 批量查询标签（根据 ID 列表）
     *
     * @param ids 标签 ID 列表
     * @return 标签列表
     */
    @Select("<script>" +
            "SELECT * FROM tags WHERE id IN " +
            "<foreach item='id' collection='ids' open='(' separator=',' close=')'>#{id}</foreach>" +
            "</script>")
    List<Tag> findAllByIds(@Param("ids") List<Long> ids);
}
