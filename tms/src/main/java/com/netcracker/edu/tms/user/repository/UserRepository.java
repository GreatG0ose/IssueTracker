package com.netcracker.edu.tms.user.repository;

import com.netcracker.edu.tms.user.model.User;
import org.springframework.data.repository.CrudRepository;

import java.math.BigInteger;

public interface UserRepository extends CrudRepository<User, BigInteger>{
    User findByEmail(String email);

    boolean existsByEmail(String email);
}
