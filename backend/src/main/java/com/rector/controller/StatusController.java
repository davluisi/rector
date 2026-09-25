package com.rector.controller;

import com.rector.RectorApplication.StatusResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StatusController {

    @GetMapping("/api/status")
    public StatusResponse getStatus() {
        return new StatusResponse("UP", "Rector Backend is running successfully.");
    }
}
