package com.liuzeyu.todolist.common.result;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 通用分页结果 — 替代 Spring Data Page，与前端期望的 JSON 格式一致。
 * JSON: { "content": [...], "totalElements": N, "totalPages": N, "size": N, "number": N }
 */
public class PageResult<T> {

    private List<T> content;
    private long totalElements;
    private int totalPages;
    private int size;
    private int number;

    public PageResult() {
    }

    public PageResult(List<T> content, long totalElements, int pageNum, int pageSize) {
        this.content = content;
        this.totalElements = totalElements;
        this.size = pageSize;
        this.number = pageNum - 1; // 前端 zero-indexed
        this.totalPages = pageSize > 0 ? (int) Math.ceil((double) totalElements / pageSize) : 0;
    }

    /**
     * 转换内容类型（如 Task → TaskWithSubtasks）
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
