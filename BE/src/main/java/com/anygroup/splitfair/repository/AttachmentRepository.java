package com.anygroup.splitfair.repository;

import com.anygroup.splitfair.model.Attachment;
import com.anygroup.splitfair.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

    List<Attachment> findByExpense(Expense expense);
}
