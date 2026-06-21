package com.projectos.host;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class ProcessHostCommandRunner implements HostCommandRunner {

    @Override
    public HostCommandResult run(List<String> command) {
        try {
            Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            int exitCode = process.waitFor();
            return new HostCommandResult(exitCode == 0, output);
        } catch (IOException exception) {
            return new HostCommandResult(false, exception.getMessage());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return new HostCommandResult(false, "Command interrupted.");
        }
    }
}
