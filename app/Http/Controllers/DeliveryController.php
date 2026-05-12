<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use Illuminate\Http\Request;
use App\Models\Attachment;
use Illuminate\Support\Facades\Storage;

class DeliveryController extends Controller
{
    public function index()
    {
        $deliveries = Delivery::with("supplier")
            ->withCount("equipment")
            ->orderBy("created_at", "desc")
            ->get();

        return response()->json($deliveries);
    }

    public function match(Request $request)
    {
        $request->validate([
            "handle" => "required|string",
            "mode" => "required|in:voucher,invoice",
        ]);

        $field = $request->mode === "voucher" ? "voucher_no" : "invoice_no";

        $delivery = Delivery::where($field, $request->handle)
            ->with("supplier")
            ->first();

        if (!$delivery) {
            return response()->json(["matched" => false]);
        }

        return response()->json([
            "matched" => true,
            "delivery_id" => $delivery->id,
            "supplier_id" => $delivery->supplier_id,
            "supplier_name" => $delivery->supplier->name,
            "purchase_date" => $delivery->purchase_date->format("Y-m-d"),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            "voucher_no" => "nullable|string|unique:deliveries,voucher_no",
            "invoice_no" => "nullable|string|unique:deliveries,invoice_no",
            "supplier_id" => "required|exists:suppliers,id",
            "purchase_date" => "required|date",
            "order_no" => "nullable|string",
            "notes" => "nullable|string",
        ]);

        $delivery = Delivery::create(
            $request->only([
                "voucher_no",
                "invoice_no",
                "supplier_id",
                "purchase_date",
                "order_no",
                "notes",
            ]),
        );

        return response()->json($delivery->load("supplier"), 201);
    }

    public function show(Delivery $delivery)
    {
        return response()->json(
            $delivery->load([
                "supplier",
                "equipment.brand",
                "equipment.model",
                "attachments",
            ]),
        );
    }

    public function update(Request $request, Delivery $delivery)
    {
        $request->validate([
            "voucher_no" =>
                "nullable|string|unique:deliveries,voucher_no," . $delivery->id,
            "invoice_no" =>
                "nullable|string|unique:deliveries,invoice_no," . $delivery->id,
            "supplier_id" => "sometimes|exists:suppliers,id",
            "purchase_date" => "sometimes|date",
            "order_no" => "nullable|string",
            "notes" => "nullable|string",
        ]);

        $delivery->update(
            $request->only([
                "voucher_no",
                "invoice_no",
                "supplier_id",
                "purchase_date",
                "order_no",
                "notes",
            ]),
        );

        return response()->json($delivery->load("supplier"));
    }

    public function attachFile(Request $request, Delivery $delivery)
    {
        $request->validate([
            "file" => "required|file|mimes:pdf|max:25600",
        ]);

        // Soft-delete existing attachment if one exists
        $delivery->attachments()->each(fn($att) => $att->delete());

        $file = $request->file("file");
        $path = $file->store('deliveries/attachments', 'public');
        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getClientMimeType();
        $fileSize = $file->getSize();

        $attachment = $delivery->attachments()->create([
            "file_path" => $path,
            "original_filename" => $originalName,
            "mime_type" => $mimeType,
            "file_size" => $fileSize,
            "uploaded_by" => auth()->id(),
            "uploaded_by_name" =>
                auth()->user()->first_name . " " . auth()->user()->last_name,
        ]);

        return response()->json($attachment, 201);
    }
    public function removeAttachment(Delivery $delivery, Attachment $attachment)
    {
        if ($attachment->attachable_id !== $delivery->id) {
            return response()->json(
                ["message" => "Attachment does not belong to this delivery."],
                403,
            );
        }

        $attachment->delete();

        return response()->json(["message" => "Attachment removed."]);
    }
    public function streamAttachment(Delivery $delivery, Attachment $attachment)
{
    if ($attachment->attachable_id !== $delivery->id) {
        return response()->json(['message' => 'Attachment does not belong to this delivery.'], 403);
    }

    if (!Storage::disk('public')->exists($attachment->file_path)) {
    return response()->json(['message' => 'File not found.'], 404);
}

return Storage::disk('public')->response($attachment->file_path, $attachment->original_filename, [
    'Content-Type'        => 'application/pdf',
    'Content-Disposition' => 'inline; filename="' . $attachment->original_filename . '"',
]);
}
}
