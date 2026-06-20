package com.projectos.system;

public interface RecommendedActionDismissals {
    boolean dismissed(String actionId);

    void dismiss(String actionId);
}
