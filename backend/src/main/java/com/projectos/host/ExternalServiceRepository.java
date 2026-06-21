package com.projectos.host;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.projectos.database.DatabaseBackedRepository;
import com.projectos.database.ProjectOsDatabase;
import com.projectos.marketplace.install.InstallationException;
import com.projectos.marketplace.runtime.RuntimeLayout;

@Repository
public class ExternalServiceRepository extends DatabaseBackedRepository {

    @Autowired
    public ExternalServiceRepository(ProjectOsDatabase database) {
        super(database);
    }

    public ExternalServiceRepository(RuntimeLayout runtimeLayout) {
        this(new ProjectOsDatabase(runtimeLayout));
    }

    public void save(ExternalService service) {
        migrate();
        String sql = """
                insert into external_services(id, name, url, category, access_scope, health_check_enabled, management_mode, created_at)
                values(?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(id) do update set
                    name = excluded.name,
                    url = excluded.url,
                    category = excluded.category,
                    access_scope = excluded.access_scope,
                    health_check_enabled = excluded.health_check_enabled
                """;
        try (Connection connection = connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, service.id());
            statement.setString(2, service.name());
            statement.setString(3, service.url());
            statement.setString(4, service.category());
            statement.setString(5, service.accessScope());
            statement.setInt(6, service.healthCheckEnabled() ? 1 : 0);
            statement.setString(7, service.managementMode());
            statement.setString(8, service.createdAt().toString());
            statement.executeUpdate();
        } catch (SQLException exception) {
            throw new InstallationException("Unable to save linked external service.", exception);
        }
    }

    public List<ExternalService> findAll() {
        migrate();
        try (Connection connection = connection(); PreparedStatement statement = connection.prepareStatement("select * from external_services order by name")) {
            ResultSet resultSet = statement.executeQuery();
            List<ExternalService> services = new ArrayList<>();
            while (resultSet.next()) {
                services.add(externalService(resultSet));
            }
            return services;
        } catch (SQLException exception) {
            throw new InstallationException("Unable to read linked external services.", exception);
        }
    }

    public Optional<ExternalService> findById(String id) {
        migrate();
        try (Connection connection = connection(); PreparedStatement statement = connection.prepareStatement("select * from external_services where id = ?")) {
            statement.setString(1, id);
            ResultSet resultSet = statement.executeQuery();
            if (resultSet.next()) {
                return Optional.of(externalService(resultSet));
            }
            return Optional.empty();
        } catch (SQLException exception) {
            throw new InstallationException("Unable to read linked external service.", exception);
        }
    }

    public boolean delete(String id) {
        migrate();
        try (Connection connection = connection(); PreparedStatement statement = connection.prepareStatement("delete from external_services where id = ?")) {
            statement.setString(1, id);
            return statement.executeUpdate() > 0;
        } catch (SQLException exception) {
            throw new InstallationException("Unable to remove linked external service.", exception);
        }
    }

    private ExternalService externalService(ResultSet resultSet) throws SQLException {
        return new ExternalService(
                resultSet.getString("id"),
                resultSet.getString("name"),
                resultSet.getString("url"),
                resultSet.getString("category"),
                resultSet.getString("access_scope"),
                resultSet.getInt("health_check_enabled") == 1,
                resultSet.getString("management_mode"),
                Instant.parse(resultSet.getString("created_at")));
    }
}
