package com.mondopt.controller;

import com.mondopt.MondoPtApplication.StatusResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StatusController {

    @GetMapping("/api/status")
    public StatusResponse getStatus() {
        return new StatusResponse("UP", "MondoPT Backend is running successfully.");
    }
}
