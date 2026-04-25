using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgresSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "apps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Port = table.Column<int>(type: "integer", nullable: true),
                    BuildCommand = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    StartCommand = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ProjectRootPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    HealthCheckPath = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_apps", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "domains",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AppId = table.Column<Guid>(type: "uuid", nullable: false),
                    Hostname = table.Column<string>(type: "character varying(253)", maxLength: 253, nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_domains", x => x.Id);
                    table.ForeignKey(
                        name: "FK_domains_apps_AppId",
                        column: x => x.AppId,
                        principalTable: "apps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "environment_variables",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AppId = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    IsSecret = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_environment_variables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_environment_variables_apps_AppId",
                        column: x => x.AppId,
                        principalTable: "apps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "repositories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AppId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Owner = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Branch = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CloneUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    ExternalRepositoryId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    WebhookSecret = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ConnectedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_repositories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_repositories_apps_AppId",
                        column: x => x.AppId,
                        principalTable: "apps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "deployments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AppId = table.Column<Guid>(type: "uuid", nullable: false),
                    RepositoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Trigger = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Branch = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CommitSha = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    ArtifactReference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FinishedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deployments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_deployments_apps_AppId",
                        column: x => x.AppId,
                        principalTable: "apps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_deployments_repositories_RepositoryId",
                        column: x => x.RepositoryId,
                        principalTable: "repositories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "log_entries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AppId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeploymentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Level = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Message = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_log_entries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_log_entries_apps_AppId",
                        column: x => x.AppId,
                        principalTable: "apps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_log_entries_deployments_DeploymentId",
                        column: x => x.DeploymentId,
                        principalTable: "deployments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "apps",
                columns: new[] { "Id", "BuildCommand", "CreatedAtUtc", "Description", "HealthCheckPath", "Name", "Port", "ProjectRootPath", "Slug", "StartCommand", "Status", "UpdatedAtUtc" },
                values: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), "docker build -t hosting-paas-demo .", new DateTime(2026, 4, 24, 0, 0, 0, 0, DateTimeKind.Utc), "Seed app used to validate the initial schema.", "/health", "Hosting PaaS Demo", 8080, "/src", "hosting-paas-demo", "docker run -p 8080:8080 hosting-paas-demo", "Draft", new DateTime(2026, 4, 24, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.InsertData(
                table: "domains",
                columns: new[] { "Id", "AppId", "CreatedAtUtc", "Hostname", "IsPrimary", "Status" },
                values: new object[] { new Guid("33333333-3333-3333-3333-333333333333"), new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2026, 4, 24, 0, 0, 0, 0, DateTimeKind.Utc), "demo.hosting-paas.local", true, "Pending" });

            migrationBuilder.InsertData(
                table: "environment_variables",
                columns: new[] { "Id", "AppId", "CreatedAtUtc", "IsSecret", "Key", "UpdatedAtUtc", "Value" },
                values: new object[] { new Guid("44444444-4444-4444-4444-444444444444"), new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2026, 4, 24, 0, 0, 0, 0, DateTimeKind.Utc), false, "ASPNETCORE_ENVIRONMENT", new DateTime(2026, 4, 24, 0, 0, 0, 0, DateTimeKind.Utc), "Production" });

            migrationBuilder.InsertData(
                table: "repositories",
                columns: new[] { "Id", "AppId", "Branch", "CloneUrl", "ConnectedAtUtc", "ExternalRepositoryId", "Name", "Owner", "Provider", "WebhookSecret" },
                values: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), new Guid("11111111-1111-1111-1111-111111111111"), "main", "https://github.com/example/hosting-paas-demo.git", new DateTime(2026, 4, 24, 0, 0, 0, 0, DateTimeKind.Utc), "repo_seed_demo", "hosting-paas-demo", "example", "GitHub", "change-me" });

            migrationBuilder.InsertData(
                table: "deployments",
                columns: new[] { "Id", "AppId", "ArtifactReference", "Branch", "CommitSha", "CreatedAtUtc", "FailureReason", "FinishedAtUtc", "RepositoryId", "StartedAtUtc", "Status", "Trigger" },
                values: new object[] { new Guid("55555555-5555-5555-5555-555555555555"), new Guid("11111111-1111-1111-1111-111111111111"), "seed/demo:v1", "main", "abcdef1", new DateTime(2026, 4, 24, 0, 0, 0, 0, DateTimeKind.Utc), null, new DateTime(2026, 4, 24, 0, 3, 0, 0, DateTimeKind.Utc), new Guid("22222222-2222-2222-2222-222222222222"), new DateTime(2026, 4, 24, 0, 0, 0, 0, DateTimeKind.Utc), "Succeeded", "Manual" });

            migrationBuilder.InsertData(
                table: "log_entries",
                columns: new[] { "Id", "AppId", "DeploymentId", "Level", "Message", "Source", "TimestampUtc" },
                values: new object[] { new Guid("66666666-6666-6666-6666-666666666666"), new Guid("11111111-1111-1111-1111-111111111111"), new Guid("55555555-5555-5555-5555-555555555555"), "Information", "Initial demo deployment seeded for local development.", "seed", new DateTime(2026, 4, 24, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.CreateIndex(
                name: "IX_apps_Slug",
                table: "apps",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_deployments_AppId_CreatedAtUtc",
                table: "deployments",
                columns: new[] { "AppId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_deployments_CommitSha",
                table: "deployments",
                column: "CommitSha");

            migrationBuilder.CreateIndex(
                name: "IX_deployments_RepositoryId",
                table: "deployments",
                column: "RepositoryId");

            migrationBuilder.CreateIndex(
                name: "IX_domains_AppId_IsPrimary",
                table: "domains",
                columns: new[] { "AppId", "IsPrimary" },
                filter: "\"IsPrimary\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_domains_Hostname",
                table: "domains",
                column: "Hostname",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_environment_variables_AppId_Key",
                table: "environment_variables",
                columns: new[] { "AppId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_log_entries_AppId_TimestampUtc",
                table: "log_entries",
                columns: new[] { "AppId", "TimestampUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_log_entries_DeploymentId_TimestampUtc",
                table: "log_entries",
                columns: new[] { "DeploymentId", "TimestampUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_repositories_AppId",
                table: "repositories",
                column: "AppId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_repositories_Provider_Owner_Name_Branch",
                table: "repositories",
                columns: new[] { "Provider", "Owner", "Name", "Branch" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "domains");

            migrationBuilder.DropTable(
                name: "environment_variables");

            migrationBuilder.DropTable(
                name: "log_entries");

            migrationBuilder.DropTable(
                name: "deployments");

            migrationBuilder.DropTable(
                name: "repositories");

            migrationBuilder.DropTable(
                name: "apps");
        }
    }
}
