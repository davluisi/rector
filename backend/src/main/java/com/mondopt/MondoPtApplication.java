package com.mondopt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MondoPtApplication {

	public static class StatusResponse {
		private String status;
		private String message;

		public StatusResponse(String status, String message) {
			this.status = status;
			this.message = message;
		}

		public String getStatus() {
			return status;
		}

		public String getMessage() {
			return message;
		}
	}

	public static void main(String[] args) {
		SpringApplication.run(MondoPtApplication.class, args);
	}
}
