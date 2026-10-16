import {
	useToast,
	Flex,
	Box,
	Avatar,
	CircularProgress,
	Button,
	Input,
} from "@chakra-ui/react";
import { IUser } from "@libs/types/user";
import axios from "axios";
import { FC, useEffect, useState } from "react";
import { getMediaUrl } from "@libs/helpers/media";
import { uploadMediaFiles } from "@libs/helpers/uploadMedia.client";
import { FaSave } from "react-icons/fa";
import { MdCamera } from "react-icons/md";

interface IProfileUpdate {
	user: IUser;
}

export const ProfileUpdate: FC<IProfileUpdate> = ({ user }) => {
	const [file, setFile] = useState<File | null>(null);
	const [profileUrl, setProfileUrl] = useState(user.profile_url);
	const [previewUrl, setPreviewUrl] = useState<string>();
	const [progress, setProgress] = useState(0);
	const [uploading, setUploading] = useState(false);
	const toast = useToast();

	useEffect(() => {
		if (!file) return;
		const objectUrl = URL.createObjectURL(file);
		setPreviewUrl(objectUrl);
		return () => URL.revokeObjectURL(objectUrl);
	}, [file]);

	const uploadImage = async () => {
		if (!file) return;
		setUploading(true);
		try {
			const [url] = await uploadMediaFiles({ files: [{ file, mediaKind: "image" }], userId: user.id, purpose: "profile", onProgress: setProgress });
			const response = await axios.post("/api/user/uploadProfile", { url });
			setProfileUrl(response.data?.user?.profile_url || profileUrl);
			toast({ title: "Success", variant: "solid", description: "Profile picture uploaded", status: "success" });
		} catch (error: any) {
			toast({ title: "Error", variant: "solid", description: error?.response?.data?.err || "Can't upload profile picture. Please try again.", status: "error" });
		} finally {
			setUploading(false);
			setFile(null);
			setProgress(0);
		}
	};
	return (
		<Flex direction={"column"} alignItems="center">
			<Box position="relative">
				<Avatar size="2xl" name={user.firstName + " " + user.lastName} src={previewUrl || getMediaUrl(profileUrl, "profile")} />
				{uploading && (
					<Flex
						position="absolute"
						left="0"
						top="0"
						width="100%"
						height="100%"
						background="blackAlpha.500"
						alignItems="center"
						justifyContent="center"
						borderRadius="full"
					>
						<CircularProgress
							size="80px"
							thickness={"4px"}
							value={progress}
						></CircularProgress>
					</Flex>
				)}
			</Box>
			<Box my="5" position="relative">
				<Button cursor="pointer" leftIcon={<MdCamera />}>
					Upload Image
				</Button>
				<Input
					disabled={uploading}
					onChange={(e) => {
						const selectedFile = e.target.files?.[0] || null;
						setFile(selectedFile);
						if (!selectedFile) setPreviewUrl(undefined);
					}}
					accept="image/jpeg,image/png,image/webp,image/gif"
					cursor="pointer"
					type="file"
					position="absolute"
					top="0"
					left="0"
					width="100%"
					height="100%"
					opacity="0"
					aria-hidden="true"
				/>
			</Box>
			{file && (
				<Button
					disabled={uploading}
					onClick={uploadImage}
					colorScheme="blue"
					size="sm"
					leftIcon={<FaSave />}
				>
					Apply
				</Button>
			)}
		</Flex>
	);
};
