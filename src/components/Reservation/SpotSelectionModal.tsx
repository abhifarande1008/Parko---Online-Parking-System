import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { resetParkingArea } from "@/store/slices/ParkingAreaSlice";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Dot } from "lucide-react";
import { sniglet } from "@/styles/fonts/Fonts";
import { toast } from "sonner";
import InlineLoader from "../ui/inline-loader";
import { setReservation } from "@/store/slices/ReservationSlice";
import { useAuthContext } from "@/context/auth-context";

const RENT_PER_HOUR = 10;
const TAX_RATE = 0.18;

const SpotSelectionModal: React.FC<React.ComponentProps<typeof Dialog>> = (props) => {
    const { selectedParkingArea } = useSelector((state: RootState) => state.parkingArea);
    const { reservation } = useSelector((state: RootState) => state.reservation);
    const showModal = !!(selectedParkingArea && selectedParkingArea._id);
    const [selectedSpots, setSelectedSpots] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const { loadSession } = useAuthContext();
    const dispatch = useDispatch();

    const subtotal = RENT_PER_HOUR * selectedSpots.length;
    const totalPrice = +(subtotal * (1 + TAX_RATE)).toFixed(2);

    const resetModal = () => {
        setSelectedSpots([]);
    };

    useEffect(() => {
        resetModal();
    }, [showModal]);

    const handleClose = () => {
        dispatch(resetParkingArea());
    };

    const toggleParkingSpot = (spotId: string) => {
        setSelectedSpots((prev) => {
            if (prev.includes(spotId)) {
                return prev.filter((id) => id !== spotId);
            }
            if (prev.length >= 3) {
                toast.error("You cannot select more than 3 parking spots");
                return prev;
            }
            return [...prev, spotId];
        });
    };

    const handleConfirmBooking = async () => {
        if (!selectedParkingArea) {
            return toast.error("Not a valid Parking Area");
        }
        if (!selectedSpots.length) {
            return toast.error("Select a Parking Spot to Proceed");
        }

        try {
            setLoading(true);

            const response = await fetch("/api/reservation/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    parkingAreaId: selectedParkingArea._id,
                    parkingSpots: selectedSpots,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || data.message || "Error booking parking spot");
                return;
            }

            toast.success(data.message || "Parking spot booked successfully!");
            dispatch(setReservation(data.reservation));
            resetModal();
            dispatch(resetParkingArea());
            loadSession();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error booking parking spot");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={showModal} onOpenChange={handleClose} {...props}>
            <DialogContent className="sm:max-w-[80vw] sm:w-[40vw] overflow-auto">
                <DialogHeader>
                    <DialogTitle>Select Parking Spot</DialogTitle>
                    <DialogDescription>
                        {reservation ? (
                            <span className="text-destructive">You already have an ongoing parking session</span>
                        ) : (
                            <span className="flex w-full justify-center items-center">
                                <Dot className="text-success h-12 w-12" /> Available
                                <Dot className="text-destructive h-12 w-12" /> Occupied
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <Card className="overflow-auto w-full flex items-center justify-start p-2 max-h-[56vh]">
                    <CardContent className="flex justify-start items-center w-full">
                        <div className="columns-2 space-y-3 space-x-4 p-0">
                            {selectedParkingArea?.parkingSpots.map((spot) => (
                                <Card
                                    key={spot._id}
                                    className={`break-inside-avoid sm:w-[84px] p-2 text-lg ${sniglet.className} min-w-[84px] border ${
                                        spot?.status === "available"
                                            ? "bg-success/10 border-success cursor-pointer"
                                            : "bg-destructive/10 border-destructive text-muted-foreground"
                                    } ${selectedSpots.includes(spot._id) ? "bg-success" : ""}`}
                                    onClick={spot.status === "available" ? () => toggleParkingSpot(spot._id) : undefined}
                                >
                                    <CardContent className="p-0 flex justify-center items-center">
                                        <p>{spot.spotNumber}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {selectedSpots.length > 0 && (
                    <div className="text-sm text-muted-foreground flex justify-between px-1">
                        <span>{selectedSpots.length} spot{selectedSpots.length > 1 ? "s" : ""} × ₹{RENT_PER_HOUR}/hr + 18% tax</span>
                        <span className="font-semibold text-foreground">₹{totalPrice}</span>
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="success"
                        disabled={!selectedSpots.length || loading || !!reservation}
                        onClick={handleConfirmBooking}
                    >
                        {loading ? <InlineLoader /> : selectedSpots.length ? `Confirm Booking — ₹${totalPrice}` : "Select a Spot"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SpotSelectionModal;
