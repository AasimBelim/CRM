import { Link } from "react-router-dom";
import type { Listing } from "../types/Listings";
import { formatNumber } from "../utils/helpers";
import { MapIcon } from "lucide-react";

const ListingCard = ({ listing }: { listing: Listing }) => {
    const imageUrl = listing.featuredImageUrl || "https://dummyimage.com/300x200/000/fff";
    const truncatedDescription = listing.description.length > 100 
        ? listing.description.substring(0, 100) + "..." 
        : listing.description;

    return (
        <div className="card h-100">
            <Link to={`/listing/${listing.id}`}>
                <img src={imageUrl} className="card-img-top" alt={listing.title} style={{ height: "200px", objectFit: "cover" }} />
            </Link>
            <div className="card-body d-flex flex-column">
                <Link to={`/listing/${listing.id}`} className="text-decoration-none">
                    <h5 className="card-title mb-1">{listing.title}</h5>
                </Link>
                <p className="card-text mb-2 text-muted small">{truncatedDescription}</p>
                <div className="mt-auto">
                    <span className="text-success fw-bold d-block mb-2">₹{formatNumber(listing.price)}</span>
                    {listing.city && listing.state && (
                        <small className="text-muted d-flex align-items-center gap-2 mb-2">
                            <MapIcon className="text-danger" size={16} /> {listing.city.name}, {listing.state.name}
                        </small>
                    )}
                    <Link to={`/listing/${listing.id}`} className="btn btn-dark btn-sm w-100">View Details</Link>
                </div>
            </div>
        </div>
    );
};

export default ListingCard;