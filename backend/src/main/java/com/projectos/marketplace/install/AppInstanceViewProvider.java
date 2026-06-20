package com.projectos.marketplace.install;

import java.util.List;

@FunctionalInterface
public interface AppInstanceViewProvider {
    List<AppInstanceView> list();
}
