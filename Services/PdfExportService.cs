using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Travelino.Models;

namespace Travelino.Services;

public class PdfExportService
{
    public byte[] GenerateTripPdf(Trip trip)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(12).FontFamily("Arial"));

                page.Header()
                    .Text($"Útiterv: {trip.Title}")
                    .SemiBold().FontSize(20).FontColor(Colors.Blue.Medium);

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        column.Spacing(10);

                        // Trip details
                        column.Item().Text(text =>
                        {
                            text.Span("Leírás: ").SemiBold();
                            text.Span(trip.Description ?? "N/A");
                        });

                        column.Item().Text(text =>
                        {
                            text.Span("Kezdés: ").SemiBold();
                            text.Span(trip.StartDate.ToString("yyyy.MM.dd"));
                        });

                        column.Item().Text(text =>
                        {
                            text.Span("Befejezés: ").SemiBold();
                            text.Span(trip.EndDate.ToString("yyyy.MM.dd"));
                        });

                        column.Item().Text(text =>
                        {
                            text.Span("Státusz: ").SemiBold();
                            text.Span(trip.Status.ToString());
                        });

                        // Participants
                        if (trip.Participants.Any())
                        {
                            column.Item().PaddingTop(20).Text("Résztvevők").SemiBold().FontSize(16);

                            foreach (var participant in trip.Participants)
                            {
                                column.Item().Text($"• {participant.User.FirstName} {participant.User.LastName} ({participant.Role})");
                            }
                        }

                        // Waypoints
                        if (trip.Waypoints.Any())
                        {
                            column.Item().PaddingTop(20).Text("Útvonal állomások").SemiBold().FontSize(16);

                            foreach (var waypoint in trip.Waypoints.OrderBy(w => w.OrderIndex))
                            {
                                column.Item().Column(waypointColumn =>
                                {
                                    waypointColumn.Item().Text($"{waypoint.OrderIndex + 1}. {waypoint.Name}").SemiBold();

                                    if (!string.IsNullOrEmpty(waypoint.Description))
                                        waypointColumn.Item().Text($"   {waypoint.Description}");

                                    if (!string.IsNullOrEmpty(waypoint.Address))
                                        waypointColumn.Item().Text($"   Cím: {waypoint.Address}");

                                    waypointColumn.Item().Text($"   Típus: {waypoint.Type}");

                                    if (waypoint.PlannedArrival.HasValue)
                                        waypointColumn.Item().Text($"   Tervezett érkezés: {waypoint.PlannedArrival.Value:yyyy.MM.dd HH:mm}");

                                    if (!string.IsNullOrEmpty(waypoint.Notes))
                                        waypointColumn.Item().Text($"   Megjegyzés: {waypoint.Notes}");
                                });
                            }
                        }

                        // Notes
                        if (trip.Notes.Any())
                        {
                            column.Item().PaddingTop(20).Text("Jegyzetek").SemiBold().FontSize(16);

                            foreach (var note in trip.Notes.OrderByDescending(n => n.CreatedAt))
                            {
                                column.Item().Column(noteColumn =>
                                {
                                    noteColumn.Item().Text($"{note.Title}").SemiBold();
                                    noteColumn.Item().Text($"   {note.Content}");
                                    noteColumn.Item().Text($"   Szerző: {note.User.FirstName} {note.User.LastName}, {note.CreatedAt:yyyy.MM.dd}").FontSize(10).Italic();
                                });
                            }
                        }

                        // Comparison notes
                        if (!string.IsNullOrEmpty(trip.ComparisonNotes))
                        {
                            column.Item().PaddingTop(20).Text("Összehasonlítás (Tervezett vs. Tényleges)").SemiBold().FontSize(16);
                            column.Item().Text(trip.ComparisonNotes);
                        }
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Létrehozva: ");
                        x.Span(DateTime.Now.ToString("yyyy.MM.dd HH:mm"));
                    });
            });
        });

        return document.GeneratePdf();
    }
}
