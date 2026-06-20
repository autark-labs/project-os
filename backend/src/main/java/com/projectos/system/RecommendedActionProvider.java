package com.projectos.system;

public interface RecommendedActionProvider {
    RecommendedAction current();

    void dismiss(String actionId);
}
