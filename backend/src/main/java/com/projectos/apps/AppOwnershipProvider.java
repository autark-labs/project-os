package com.projectos.apps;

import java.util.List;

@FunctionalInterface
public interface AppOwnershipProvider {

    List<AppOwnershipView> apps();
}
