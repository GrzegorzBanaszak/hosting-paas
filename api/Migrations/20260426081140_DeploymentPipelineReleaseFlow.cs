using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class DeploymentPipelineReleaseFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ActivatedAtUtc",
                table: "deployments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeploymentKind",
                table: "deployments",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "StaticSite");

            migrationBuilder.AddColumn<string>(
                name: "ReleasePath",
                table: "deployments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkspacePath",
                table: "deployments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "StartCommand",
                table: "apps",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AddColumn<string>(
                name: "ActiveReleasePath",
                table: "apps",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeploymentKind",
                table: "apps",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "StaticSite");

            migrationBuilder.AddColumn<string>(
                name: "PublishDirectory",
                table: "apps",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "apps",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "ActiveReleasePath", "DeploymentKind", "PublishDirectory" },
                values: new object[] { null, "BackendApi", "/src" });

            migrationBuilder.UpdateData(
                table: "deployments",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "ActivatedAtUtc", "DeploymentKind", "ReleasePath", "WorkspacePath" },
                values: new object[] { new DateTime(2026, 4, 24, 0, 2, 0, 0, DateTimeKind.Utc), "BackendApi", "/releases/hosting-paas-demo/55555555555555555555555555555555", "/workspace/hosting-paas-demo/55555555555555555555555555555555" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActivatedAtUtc",
                table: "deployments");

            migrationBuilder.DropColumn(
                name: "DeploymentKind",
                table: "deployments");

            migrationBuilder.DropColumn(
                name: "ReleasePath",
                table: "deployments");

            migrationBuilder.DropColumn(
                name: "WorkspacePath",
                table: "deployments");

            migrationBuilder.DropColumn(
                name: "ActiveReleasePath",
                table: "apps");

            migrationBuilder.DropColumn(
                name: "DeploymentKind",
                table: "apps");

            migrationBuilder.DropColumn(
                name: "PublishDirectory",
                table: "apps");

            migrationBuilder.AlterColumn<string>(
                name: "StartCommand",
                table: "apps",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000,
                oldNullable: true);
        }
    }
}
