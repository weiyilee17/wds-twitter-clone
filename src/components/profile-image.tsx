import Image from "next/image";
import { VscAccount } from "react-icons/vsc";

type ProfileImageProps = {
  src?: string | null;
  className?: string;
};

function ProfileImage({ src, className }: ProfileImageProps) {
  return (
    <div
      className={`relative h-12 w-12 overflow-hidden rounded-full ${className}`}
    >
      {src === null || src === undefined ? (
        <VscAccount className="h-full w-full" />
      ) : (
        // fill fills the image to the etire parent, needs parent to have relative though
        <Image src={src} alt="Profile Image" quality={100} fill sizes="48" />
      )}
    </div>
  );
}

export default ProfileImage;
