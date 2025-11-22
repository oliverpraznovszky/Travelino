using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Travelino.Models;
using System.Text;

namespace Travelino.Services;

public class PdfExportService
{
    private readonly IHttpClientFactory _httpClientFactory;

    public PdfExportService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

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

                        column.Item().Text(text =>
                        {
                            text.Span("Utazási mód: ").SemiBold();
                            text.Span(trip.TravelMode == TravelMode.Walking ? "Gyalog" : "Autóval");
                        });

                        // Map visualization
                        if (trip.Waypoints.Any())
                        {
                            column.Item().PaddingTop(20).Text("Útvonal térkép").SemiBold().FontSize(16);

                            try
                            {
                                var mapImageBytes = GetStaticMapImage(trip.Waypoints.OrderBy(w => w.OrderIndex).ToList());
                                if (mapImageBytes != null && mapImageBytes.Length > 0)
                                {
                                    column.Item().Image(mapImageBytes).FitWidth();
                                }
                                else
                                {
                                    column.Item().Text("(A térkép nem elérhető)").Italic().FontSize(10);
                                }
                            }
                            catch (Exception ex)
                            {
                                column.Item().Text($"(Térkép betöltési hiba: {ex.Message})").Italic().FontSize(10);
                            }
                        }

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

    private byte[]? GetStaticMapImage(List<Waypoint> waypoints)
    {
        if (!waypoints.Any())
            return null;

        try
        {
            // Calculate bounding box
            var minLat = waypoints.Min(w => w.Latitude);
            var maxLat = waypoints.Max(w => w.Latitude);
            var minLon = waypoints.Min(w => w.Longitude);
            var maxLon = waypoints.Max(w => w.Longitude);

            // Add padding (approximately 10% on each side)
            var latPadding = (maxLat - minLat) * 0.1;
            var lonPadding = (maxLon - minLon) * 0.1;

            minLat -= latPadding;
            maxLat += latPadding;
            minLon -= lonPadding;
            maxLon += lonPadding;

            // Calculate center and zoom
            var centerLat = (minLat + maxLat) / 2;
            var centerLon = (minLon + maxLon) / 2;

            // Calculate appropriate zoom level based on bounding box
            var zoom = CalculateZoomLevel(minLat, maxLat, minLon, maxLon, 800, 600);

            // Build marker string for waypoints
            var markers = new StringBuilder();
            for (int i = 0; i < waypoints.Count; i++)
            {
                var waypoint = waypoints[i];
                // Add marker with number label
                markers.Append($"&markers={waypoint.Latitude},{waypoint.Longitude},red-{i + 1}");
            }

            // Construct static map URL using StaticMap service
            // Using geoapify.com free tier (no API key needed for basic usage)
            // Alternative: use staticmap.openstreetmap.de
            var mapUrl = $"https://staticmap.openstreetmap.de/staticmap.php?" +
                         $"center={centerLat},{centerLon}" +
                         $"&zoom={zoom}" +
                         $"&size=800x600" +
                         $"&maptype=mapnik" +
                         BuildMarkers(waypoints);

            // Download the image
            var httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(10);

            var response = httpClient.GetAsync(mapUrl).GetAwaiter().GetResult();

            if (response.IsSuccessStatusCode)
            {
                return response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult();
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    private string BuildMarkers(List<Waypoint> waypoints)
    {
        var markers = new StringBuilder();

        for (int i = 0; i < waypoints.Count; i++)
        {
            var waypoint = waypoints[i];
            // Format: &markers=lat,lon,color
            markers.Append($"&markers={waypoint.Latitude},{waypoint.Longitude},lightblue{i + 1}");
        }

        return markers.ToString();
    }

    private int CalculateZoomLevel(double minLat, double maxLat, double minLon, double maxLon, int mapWidth, int mapHeight)
    {
        // Simple zoom calculation based on bounding box
        var latDiff = maxLat - minLat;
        var lonDiff = maxLon - minLon;

        // Approximate zoom levels
        if (latDiff > 10 || lonDiff > 10) return 6;
        if (latDiff > 5 || lonDiff > 5) return 8;
        if (latDiff > 2 || lonDiff > 2) return 10;
        if (latDiff > 1 || lonDiff > 1) return 11;
        if (latDiff > 0.5 || lonDiff > 0.5) return 12;
        if (latDiff > 0.2 || lonDiff > 0.2) return 13;
        if (latDiff > 0.1 || lonDiff > 0.1) return 14;

        return 15;
    }
}
