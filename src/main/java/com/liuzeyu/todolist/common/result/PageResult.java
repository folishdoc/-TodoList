package com.liuzeyu.todolist.common.result;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 通用分页结果 — 替代 Spring Data Page，与前端期望的 JSON 格式一致
 * <p>
 * JSON 结构：{ "content": [...], "totalElements": N, "totalPages": N, "size": N, "number": N }
 * number 字段为 zero-indexed（前端组件如 Element Plus 的 el-pagination 默认 zero-indexed）。
 * 提供 {@link #map(Function)} 方法支持内容类型转换（如 Task → TaskWithSubtasks）。
 *
 * @param <T> 列表元素类型
 */
public class PageResult<T> {

    private List<T> content;
    private long totalElements;
    private int totalPages;
    private int size;
    private int number;

    public PageResult() {
    }

    /**
     * @param content    当前页数据
     * @param totalElements 总记录数
     * @param pageNum    页码（从 1 开始，内部转换为 zero-indexed）
     * @param pageSize   每页大小
     */
    public PageResult(List<T> content, long totalElements, int pageNum, int pageSize) {
        this.content = content;
        this.totalElements = totalElements;
        this.size = pageSize;
        this.number = pageNum - 1; // 前端 zero-indexed
        this.totalPages = pageSize > 0 ? (int) Math.ceil((double) totalElements / pageSize) : 0;
    }

    /**
     * 转换内容类型（如 Task → TaskWithSubtasks）
     *
     * @param converter 转换函数
     * @param <R>       目标类型
     * @return 新类型的 PageResult，分页信息保持不变
     */
    public <R> PageResult<R> map(Function<? super T, ? extends R> converter) {
        PageResult<R> result = new PageResult<>();
        result.content = this.content.stream().map(converter).collect(Collectors.toList());
        result.totalElements = this.totalElements;
        result.totalPages = this.totalPages;
        result.size = this.size;
        result.number = this.number;
        return result;
    }

    public List<T> getContent() {
        return content;
    }

    public void setContent(List<T> content) {
        this.content = content;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public int getNumber() {
        return number;
    }

    public void setNumber(int number) {
        this.number = number;
    }
}
