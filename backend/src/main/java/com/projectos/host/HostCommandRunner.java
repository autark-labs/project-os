package com.projectos.host;

import java.util.List;

public interface HostCommandRunner {

    HostCommandResult run(List<String> command);
}
